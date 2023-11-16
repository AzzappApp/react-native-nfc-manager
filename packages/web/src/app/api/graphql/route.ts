/* eslint-disable react-hooks/rules-of-hooks */
import { useLogger, useErrorHandler } from '@envelop/core';
import { useDisableIntrospection } from '@envelop/disable-introspection';
import { UnauthenticatedError, useGenericAuth } from '@envelop/generic-auth';
import { useSentry } from '@envelop/sentry';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { createYoga } from 'graphql-yoga';
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { compare } from 'semver';
import { createGraphQLContext, schema } from '@azzapp/data';
import {
  getDatabaseConnectionsInfos,
  startDatabaseConnectionMonitoring,
} from '@azzapp/data/domains/databaseMonitorer';
import queryMap from '@azzapp/relay/query-map.json';
import ERRORS from '@azzapp/shared/errors';
import { getSessionData } from '#helpers/tokens';
import packageJSON from '../../../../package.json';
import type { GraphQLContext } from '@azzapp/data';
import type { Profile } from '@azzapp/data/domains';
import type { Plugin } from '@envelop/types';
import type { GraphQLError } from 'graphql';
import type { LogLevel, Plugin as YogaPlugin } from 'graphql-yoga';

const LAST_SUPPORTED_APP_VERSION =
  process.env.LAST_SUPPORTED_APP_VERSION ?? packageJSON.version;

function useRevalidateTag(): Plugin<GraphQLContext> {
  return {
    onExecute: () => {
      return {
        onExecuteDone(payload) {
          payload.args.contextValue.cardUsernamesToRevalidate.forEach(
            username => {
              revalidateTag(username);
            },
          );
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
      allowArbitraryOperations: process.env.NODE_ENV !== 'production',
    }),
    useGenericAuth({
      resolveUserFn: async (context: GraphQLContext) => {
        try {
          const res = await getSessionData();

          const profileId = headers().get('azzapp-profileId');
          let profile: Profile | null = null;
          if (profileId) {
            profile = await context.loaders.Profile.load(profileId);
            if (profile?.userId !== res?.userId) {
              return null;
            }
          }

          return {
            ...res,
            profileId,
          };
        } catch (e) {
          console.log('error', e);
          return null;
        }
      },
      contextFieldName: 'auth',
      validateUser: params => {
        if (!params.user?.userId) {
          return new UnauthenticatedError(`Unauthenticated`, {
            extensions: {
              code: ERRORS.INVALID_TOKEN,
            },
          });
        }
      },
      mode: 'protect-all',
    }),
    useRevalidateTag(),
    useDisableIntrospection({
      disableIf: () => process.env.NODE_ENV === 'production',
    }),
    useSentry({
      includeRawResult: false,
      includeExecuteVariables: true,
    }),
  ],
  context: ({ request }) => {
    const locale = request.headers.get('azzapp-locale');

    return createGraphQLContext(locale ?? undefined);
  },
});

export { handleRequest as GET, handleRequest as POST };

const removePreRelease = (version: string) => {
  const versionParts = version.split('-');
  return versionParts[0];
};
