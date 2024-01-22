/* eslint-disable react-hooks/rules-of-hooks */
import { useLogger, useErrorHandler } from '@envelop/core';
import { UnauthenticatedError, useGenericAuth } from '@envelop/generic-auth';
import { useSentry } from '@envelop/sentry';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { createYoga } from 'graphql-yoga';
import { compare } from 'semver';
import { createGraphQLContext, schema } from '@azzapp/data';
import {
  getDatabaseConnectionsInfos,
  startDatabaseConnectionMonitoring,
} from '@azzapp/data/domains/databaseMonitorer';
import ERRORS from '@azzapp/shared/errors';
import queryMap from '#persisted-query-map.json';
import { buildCoverAvatarUrl } from '#helpers/avatar';
import { AZZAPP_SERVER_HEADER, getSessionData } from '#helpers/tokens';
import packageJSON from '../../../../package.json';
import type { GraphQLContext } from '@azzapp/data';
import type { Plugin } from '@envelop/types';
import type { GraphQLError } from 'graphql';
import type { LogLevel, Plugin as YogaPlugin } from 'graphql-yoga';

const LAST_SUPPORTED_APP_VERSION =
  process.env.LAST_SUPPORTED_APP_VERSION ?? packageJSON.version;

function useRevalidatePages(): Plugin<GraphQLContext> {
  return {
    onExecute: () => {
      return {
        async onExecuteDone(payload) {
          const cards = [
            ...payload.args.contextValue.cardUsernamesToRevalidate.values(),
          ];
          const posts = [
            ...payload.args.contextValue.postsToRevalidate.values(),
          ];

          if (cards.length || posts.length) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                },
                body: JSON.stringify({
                  cards,
                  posts,
                }),
              },
            );
            if (!res.ok) {
              console.error('Error revalidating pages');
            }
          }
        },
      };
    },
  };
}

function useAppVersion(): YogaPlugin {
  return {
    onRequest({ request, fetchAPI, endResponse }) {
      const appVersion = request.headers.get('azzapp-appVersion');
      if (
        appVersion &&
        compare(
          removePreRelease(appVersion),
          removePreRelease(LAST_SUPPORTED_APP_VERSION),
        ) < 0
      ) {
        endResponse(
          new fetchAPI.Response(
            JSON.stringify({ message: ERRORS.UPDATE_APP_VERSION }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          ),
        );
      }
    },
  };
}

const SUPPORTED_LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'];

const getLoggingLevel = () => {
  const logLevel = process.env.API_LOG_LEVEL;

  if (logLevel === 'silent') {
    return false;
  }

  if (logLevel) {
    if (SUPPORTED_LOG_LEVELS.includes(logLevel)) {
      return logLevel as LogLevel;
    }
  }

  return process.env.NODE_ENV !== 'production' ? 'debug' : 'error';
};

const { handleRequest } = createYoga({
  graphqlEndpoint: '/api/graphql',
  schema,
  fetchAPI: {
    Request,
    Response,
  },
  logging: getLoggingLevel(),
  graphiql: process.env.NODE_ENV !== 'production',
  plugins: [
    useAppVersion(),
    useLogger({
      logFn: (eventName, { args }) => {
        if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
          if (eventName === 'execute-start') {
            startDatabaseConnectionMonitoring();
          }
          if (eventName === 'execute-end') {
            const infos = getDatabaseConnectionsInfos();
            if (infos) {
              const gqlName = /query\s*(\S+)\s*[{(]/g.exec(
                args.contextValue.params.query,
              )?.[1];
              console.log(
                `-------------------- Graphql Query : ${gqlName} --------------------`,
              );
              console.log('Number database requests', infos.nbRequests);
              console.log(
                'Max concurrent requests',
                infos.maxConcurrentRequests,
              );
              console.log('Queries:\n---\n', infos.queries.join('\n---\n'));
              console.log(
                '----------------------------------------------------------------',
              );
            }
          }
        }
      },
    }),
    useErrorHandler(({ errors }) => {
      errors
        .filter(
          err =>
            (err as GraphQLError).extensions?.code !== ERRORS.INVALID_TOKEN,
        )
        .map(err => console.error(err));
    }),
    usePersistedOperations({
      extractPersistedOperationId: params => {
        return 'id' in params && params.id ? (params.id as string) : null;
      },
      getPersistedOperation(id: string) {
        return (queryMap as any)[id];
      },
      allowArbitraryOperations: request => {
        if (process.env.NODE_ENV !== 'production') {
          return true;
        }
        if (process.env.API_SERVER_TOKEN) {
          return (
            request.headers.get(AZZAPP_SERVER_HEADER) ===
            process.env.API_SERVER_TOKEN
          );
        }
        return false;
      },
    }),
    useGenericAuth({
      resolveUserFn: async () => {
        try {
          const res = await getSessionData();
          return res;
        } catch (e) {
          console.log('error', e);
          return null;
        }
      },
      contextFieldName: 'auth',
      validateUser: params => {
        if (!params.user?.userId) {
          return new UnauthenticatedError(ERRORS.INVALID_TOKEN, {
            extensions: {
              code: ERRORS.INVALID_TOKEN,
            },
          });
        }
      },
      mode: 'protect-all',
    }),
    useRevalidatePages(),
    useDisableIntrospection({
      isDisabled: request => {
        return process.env.API_SERVER_TOKEN
          ? request.headers.get('authorization') !==
              process.env.API_SERVER_TOKEN
          : true;
      },
    }),
    useSentry({
      includeRawResult: false,
      includeExecuteVariables: true,
    }),
  ],
  context: ({ request }) => {
    const locale = request.headers.get('azzapp-locale');

    const sendMail = async (p: {
      email: string;
      subject: string;
      text: string;
      html: string;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendMail`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
          },
          body: JSON.stringify(p),
        },
      );

      if (!res.ok) {
        throw new Error('Error sending email');
      }
    };

    const sendSms = async (p: { phoneNumber: string; body: string }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendSms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
          },
          body: JSON.stringify(p),
        },
      );

      if (!res.ok) {
        throw new Error('Error sending sms');
      }
    };

    return createGraphQLContext(
      sendMail,
      sendSms,
      buildCoverAvatarUrl,
      locale ?? undefined,
    );
  },
});

export { handleRequest as GET, handleRequest as POST };

const removePreRelease = (version: string) => {
  const versionParts = version.split('-');
  return versionParts[0];
};
