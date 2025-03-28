/* eslint-disable react-hooks/rules-of-hooks */
import { useLogger, useErrorHandler } from '@envelop/core';
import {
  createUnauthenticatedError,
  useGenericAuth,
} from '@envelop/generic-auth';
import { useParserCache } from '@envelop/parser-cache';
import { useSentry } from '@envelop/sentry';
import { useValidationCache } from '@envelop/validation-cache';
import { maxAliasesPlugin } from '@escape.tech/graphql-armor-max-aliases';
import { maxTokensPlugin } from '@escape.tech/graphql-armor-max-tokens';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { waitUntil } from '@vercel/functions';
import { getVercelOidcToken } from '@vercel/functions/oidc';
import { Kind, OperationTypeNode, type GraphQLError } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { compare } from 'semver';
import {
  getDatabaseConnectionsInfos,
  startDatabaseConnectionMonitoring,
} from '@azzapp/data';
import { runWithPrimary } from '@azzapp/data/src/database/database';
import { DEFAULT_LOCALE, type Locale } from '@azzapp/i18n';
import { schema, type GraphQLContext } from '@azzapp/schema';
import ERRORS from '@azzapp/shared/errors';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';
import queryMap from '#persisted-query-map.json';
import { revalidateWebcardsAndPosts } from '#helpers/api';
import { getServerIntl } from '#helpers/i18nHelpers';
import { sendPushNotification } from '#helpers/notificationsHelpers';
import { withPluginsRoute } from '#helpers/queries';
import { notifyUsers } from '#helpers/sendMessages';
import { checkServerAuth, getSessionData } from '#helpers/tokens';
import { inngest } from '#inngest/client';
import packageJSON from '../../../../package.json';
import type { WebCard } from '@azzapp/data';
import type { LogLevel, Plugin as YogaPlugin } from 'graphql-yoga';

const LAST_SUPPORTED_APP_VERSION =
  process.env.LAST_SUPPORTED_APP_VERSION ?? packageJSON.version;
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

function useRevalidatePages(): YogaPlugin<GraphQLContext> {
  return {
    onExecute: ({ extendContext }) => {
      const invalidatedWebCards = new Set<string>();
      const invalidateWebCard = (userName: string) =>
        invalidatedWebCards.add(userName);
      const getInvalidatedWebCards = () => Array.from(invalidatedWebCards);

      const invalidatedPosts = new Set<string>();
      const getInvalidatedPosts = () =>
        Array.from(invalidatedPosts, key => {
          const [userName, id] = key.split(':');
          return { userName, id };
        });

      const invalidatePost = (userName: string, id: string) =>
        invalidatedPosts.add(`${userName}:${id}`);

      extendContext({
        invalidatePost,
        invalidateWebCard,
      });

      return {
        async onExecuteDone() {
          const cards = getInvalidatedWebCards();
          const posts = getInvalidatedPosts();
          revalidateWebcardsAndPosts(cards, posts);
        },
      };
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

/**
 * Middleware to check if the request is a mutation and run it on the primary database
 */
const runOnPrimaryPlugin: YogaPlugin = {
  onExecute({ args, setExecuteFn, executeFn }) {
    const operationDefinition = args.document.definitions.find(
      (definition: { kind: 'OperationDefinition' }) =>
        definition.kind === Kind.OPERATION_DEFINITION,
    );

    if (
      operationDefinition &&
      operationDefinition.operation === OperationTypeNode.MUTATION
    ) {
      setExecuteFn(() => runWithPrimary(() => executeFn(args)));
    }
  },
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
  batching: {
    limit: 5,
  },
  context: ({
    request,
  }): Omit<
    GraphQLContext,
    'currentUser' | 'invalidatePost' | 'invalidateWebCard'
  > => {
    const locale = request.headers.get('azzapp-locale') as Locale;
    return {
      locale: locale ?? DEFAULT_LOCALE,
      notifyUsers,
      validateMailOrPhone,
      sendPushNotification,
      notifyApplePassWallet,
      notifyGooglePassWallet,
      intl: getServerIntl(locale ?? DEFAULT_LOCALE),
      sendEmailSignatures: async (profileIds: string[], webCard: WebCard) => {
        await inngest.send({
          name: 'batch/emailSignature',
          data: {
            profileIds,
            webCard,
          },
        });
      },
      notifyWebCardUsers: async (webCard: WebCard, previousUpdatedAt: Date) => {
        await inngest.send({
          name: 'batch/webCardUsersNotification',
          data: {
            webCard,
            previousUpdatedAt,
          },
        });
      },
    };
  },
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
      console.log({ errors });
      errors
        .filter(err => (err as GraphQLError).message !== ERRORS.INVALID_TOKEN)
        .map(err => console.error(err));
    }),
    useParserCache(),
    useValidationCache(),
    maxAliasesPlugin({
      n: 50, // Number of aliases allowed
      allowList: ['node', 'uri'],
    }),
    maxTokensPlugin({
      n: 2000, // Number of tokens allowed
    }),
    useDisableIntrospection({
      isDisabled: async () => {
        if (process.env.NODE_ENV !== 'production') {
          return false;
        }
        try {
          await checkServerAuth();
          return false;
        } catch {
          return true;
        }
      },
    }),
    usePersistedOperations({
      extractPersistedOperationId: params => {
        return 'id' in params && params.id ? (params.id as string) : null;
      },
      getPersistedOperation(id: string) {
        return (queryMap as any)[id];
      },
      allowArbitraryOperations: async () => {
        if (
          process.env.NODE_ENV !== 'production' ||
          process.env.NEXT_PUBLIC_PLATFORM === 'development'
        ) {
          return true;
        }

        try {
          await checkServerAuth();
          return true;
        } catch {
          return false;
        }
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
      validateUser: params => {
        if (!params.user?.userId) {
          return createUnauthenticatedError({
            message: ERRORS.INVALID_TOKEN,
            statusCode: 200,
          });
        }
      },
      contextFieldName: 'currentUser',
      mode: 'protect-all',
    }) as YogaPlugin,
    useRevalidatePages() as YogaPlugin,
    useSentry({
      includeRawResult: false,
      includeExecuteVariables: true,
    }),
    runOnPrimaryPlugin,
  ],
});

export default withPluginsRoute(handleRequest);

const removePreRelease = (version: string) => {
  const versionParts = version.split('-');
  return versionParts[0];
};

const validateMailOrPhone = async (
  type: 'email' | 'phone',
  issuer: string,
  token: string,
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/validateMailOrPhone`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
      },
      body: JSON.stringify({ type, issuer, token }),
    },
  );
  if (!res.ok) {
    throw new Error('Error validating mail or phone');
  }
};

const notifyApplePassWallet = (pushToken: string) => {
  waitUntil(
    (async () => {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/notifyWallet/apple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
          },
          body: JSON.stringify({ pushToken }),
        },
      );
    })(),
  );
};

const notifyGooglePassWallet = (profileId: string, locale: string) => {
  waitUntil(
    (async () => {
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/notifyWallet/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
        },
        body: JSON.stringify({ profileId, locale }),
      });
    })(),
  );
};
