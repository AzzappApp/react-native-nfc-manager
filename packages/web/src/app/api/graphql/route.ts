/* eslint-disable react-hooks/rules-of-hooks */
import { UnauthenticatedError, useGenericAuth } from '@envelop/generic-auth';
import { useSentry } from '@envelop/sentry';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { withAxiom } from 'next-axiom';
import { compare } from 'semver';
import { createGraphqlEndpoint, type GraphQLContext } from '@azzapp/schema';
import ERRORS from '@azzapp/shared/errors';
import queryMap from '#persisted-query-map.json';
import { buildCoverAvatarUrl } from '#helpers/avatar';
import { AZZAPP_SERVER_HEADER, getSessionData } from '#helpers/tokens';
import packageJSON from '../../../../package.json';

import type { LogLevel, Plugin as YogaPlugin } from 'graphql-yoga';
const LAST_SUPPORTED_APP_VERSION =
  process.env.LAST_SUPPORTED_APP_VERSION ?? packageJSON.version;

function useRevalidatePages(): YogaPlugin<GraphQLContext> {
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

const { handleRequest } = createGraphqlEndpoint({
  graphqlEndpoint: '/api/graphql',
  fetchAPI: {
    Request,
    Response,
  },
  buildCoverAvatarUrl,
  logging: getLoggingLevel(),
  plugins: [
    useAppVersion(),
    useDisableIntrospection({
      isDisabled: request => {
        return process.env.NODE_ENV !== 'production'
          ? false
          : process.env.API_SERVER_TOKEN
            ? request.headers.get(AZZAPP_SERVER_HEADER) !==
              process.env.API_SERVER_TOKEN
            : true;
      },
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
    }) as YogaPlugin,
    useRevalidatePages() as YogaPlugin,
    useSentry({
      includeRawResult: false,
      includeExecuteVariables: true,
    }),
  ],
  sendMail: async (
    p: Array<{
      email: string;
      subject: string;
      text: string;
      html: string;
    }>,
  ) => {
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
      throw new Error('Error sending sms');
    }
  },
  sendSms: async (p: { phoneNumber: string; body: string }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendSms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
      },
      body: JSON.stringify(p),
    });

    if (!res.ok) {
      throw new Error('Error sending sms');
    }
  },
});

const handleRequestWithAxiom = withAxiom(handleRequest);

export { handleRequestWithAxiom as GET, handleRequestWithAxiom as POST };

const removePreRelease = (version: string) => {
  const versionParts = version.split('-');
  return versionParts[0];
};

export const runtime = 'nodejs';
