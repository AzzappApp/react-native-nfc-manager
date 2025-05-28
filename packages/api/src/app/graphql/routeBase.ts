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
import * as Sentry from '@sentry/nextjs';
import { waitUntil } from '@vercel/functions';
import { getVercelOidcToken } from '@vercel/functions/oidc';
import { Kind, OperationTypeNode, type GraphQLError } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { headers } from 'next/headers';
import { compare } from 'semver';
import {
  getDatabaseConnectionsInfos,
  startDatabaseConnectionMonitoring,
  runWithPrimary,
  isDatabaseMonitoringEnabled,
} from '@azzapp/data';
import { DEFAULT_LOCALE, type Locale } from '@azzapp/i18n';
import { schema, type GraphQLContext } from '@azzapp/schema';
import {
  getPerformanceLogs,
  isPerformanceLoggingEnabled,
  startPerformanceLogging,
} from '@azzapp/schema/schema';
import { createServerIntl } from '@azzapp/service/i18nServices';
import { checkServerAuth } from '@azzapp/service/serverAuthServices';
import ERRORS from '@azzapp/shared/errors';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';
import env from '#env';
import queryMap from '#persisted-query-map.json';
import { revalidateWebcardsAndPosts } from '#helpers/api';
import { withPluginsRoute } from '#helpers/queries';
import { getApiEndpoint } from '#helpers/request';
import { notifyUsers } from '#helpers/sendMessages';
import { getSessionData } from '#helpers/tokens';
import { inngest } from '#inngest/client';
import packageJSON from '../../../package.json';
import type { Plugin as YogaPlugin } from 'graphql-yoga';

const LAST_SUPPORTED_APP_VERSION =
  env.LAST_SUPPORTED_APP_VERSION ?? packageJSON.version;
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

const getLoggingLevel = () => {
  const logLevel = env.API_LOG_LEVEL;

  if (logLevel === 'silent') {
    return false;
  }

  if (logLevel) {
    return logLevel;
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
  graphqlEndpoint: '/graphql',
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

    const apiEndpoint = getApiEndpoint(request);

    return {
      locale: locale ?? DEFAULT_LOCALE,
      notifyUsers: notifyUsers(apiEndpoint),
      validateMailOrPhone: validateMailOrPhone(apiEndpoint),
      notifyApplePassWallet: notifyApplePassWallet(apiEndpoint),
      notifyGooglePassWallet: notifyGooglePassWallet(apiEndpoint),
      apiEndpoint,
      intl: createServerIntl(locale ?? DEFAULT_LOCALE),
      sendEmailSignatures: async profileIds => {
        waitUntil(
          inngest
            .send({
              name: 'batch/emailSignature',
              data: {
                profileIds,
              },
            })
            .catch(err => {
              Sentry.captureException(err);
            }),
        );
      },
      sendEmailSignature: async (profileId, deviceId, key) => {
        waitUntil(
          inngest
            .send({
              name: 'send/emailSignature',
              data: {
                profileId,
                deviceId,
                key,
              },
            })
            .catch(err => {
              Sentry.captureException(err);
            }),
        );
      },
      notifyWebCardUsers: async (webCard, editorUserId) => {
        if (webCard.isMultiUser) {
          waitUntil(
            inngest
              .send({
                name: 'batch/webCardUsersNotification',
                data: {
                  webCard,
                  editorUserId,
                },
              })
              .catch(err => {
                Sentry.captureException(err);
              }),
          );
        }
      },
      enrichContact: async (userId, contact) => {
        waitUntil(
          inngest
            .send({
              name: 'send/enrichContact',
              data: {
                userId,
                contact,
              },
            })
            .catch(err => {
              Sentry.captureException(err);
            }),
        );
      },
      cancelEnrichContact: async (userId, contactId) => {
        waitUntil(
          inngest
            .send({
              name: 'cancel/enrichContact',
              data: {
                userId,
                contactId,
              },
            })
            .catch(err => {
              Sentry.captureException(err);
            }),
        );
      },
      sendPushNotification: async (userId, message) => {
        waitUntil(
          inngest
            .send({
              name: 'send/pushNotification',
              data: {
                userId,
                message,
              },
            })
            .catch(err => {
              Sentry.captureException(err);
            }),
        );
      },
    };
  },
  plugins: [
    useAppVersion(),
    useLogger({
      logFn: (eventName, { args }) => {
        if (isDatabaseMonitoringEnabled()) {
          if (eventName === 'execute-start') {
            startDatabaseConnectionMonitoring();
          }
          if (eventName === 'execute-end') {
            const infos = getDatabaseConnectionsInfos();
            if (infos) {
              const gqlName = getQueryName(args.contextValue.params.query);
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
        if (isPerformanceLoggingEnabled()) {
          if (eventName === 'execute-start') {
            startPerformanceLogging();
          }
          if (eventName === 'execute-end') {
            const gqlName = getQueryName(args.contextValue.params.query);
            const performanceLogs = getPerformanceLogs();
            console.log(
              `-------------------- Graphql Query : ${gqlName} Performance Summary --------------------`,
            );
            if (!performanceLogs) {
              console.log('No fields recorded.');
              return;
            }

            const queryDuration =
              performance.now() - performanceLogs.requestStart;
            console.log(`Total query duration: ${queryDuration}ms`);

            if (performanceLogs.fieldLogs.length === 0) {
              console.log('No fields recorded.');
              return;
            }
            const fieldStats = new Map<
              string,
              { count: number; total: number; min: number; max: number }
            >();

            for (const log of performanceLogs.fieldLogs) {
              const stats = fieldStats.get(log.path) ?? {
                count: 0,
                total: 0,
                min: log.duration,
                max: log.duration,
              };

              stats.count += 1;
              stats.total += log.duration;
              stats.min = Math.min(stats.min, log.duration);
              stats.max = Math.max(stats.max, log.duration);

              fieldStats.set(log.path, stats);
            }
            const sortedFieldStats = Array.from(fieldStats.entries())
              .map(
                ([path, stats]) =>
                  [
                    path,
                    {
                      path,
                      count: Math.round(stats.count),
                      avg: Math.round(stats.total / stats.count),
                      min: Math.round(stats.min),
                      max: Math.round(stats.max),
                    },
                  ] as const,
              )
              .sort(([, a], [, b]) => b.avg - a.avg);
            for (const [path, stats] of sortedFieldStats) {
              console.log(
                `${path} — calls: ${stats.count}, avg: ${stats.avg}ms, min: ${stats.min}ms, max: ${stats.max}ms`,
              );
            }
            console.log(
              '----------------------------------------------------------------',
            );
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
          await checkServerAuth(await headers());
          return false;
        } catch {
          return true;
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
          env.NEXT_PUBLIC_PLATFORM === 'development'
        ) {
          return true;
        }

        try {
          await checkServerAuth(await headers());
          return true;
        } catch {
          return false;
        }
      },
    }),
    useRevalidatePages(),
    runOnPrimaryPlugin,
    useSentry({
      includeRawResult: false,
      includeExecuteVariables: true,
    }),
  ],
});

export default withPluginsRoute(handleRequest);

const removePreRelease = (version: string) => {
  const versionParts = version.split('-');
  return versionParts[0];
};

const validateMailOrPhone =
  (apiEndpoint: string) =>
  async (type: 'email' | 'phone', issuer: string, token: string) => {
    const res = await fetch(`${apiEndpoint}/validateMailOrPhone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
      },
      body: JSON.stringify({ type, issuer, token }),
    });
    if (!res.ok) {
      throw new Error('Error validating mail or phone');
    }
  };

const notifyApplePassWallet = (apiEndpoint: string) => (pushToken: string) => {
  waitUntil(
    (async () => {
      await fetch(`${apiEndpoint}/notifyWallet/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
        },
        body: JSON.stringify({ pushToken }),
      });
    })(),
  );
};

const notifyGooglePassWallet =
  (apiEndpoint: string) => (serial: string, locale: string) => {
    waitUntil(
      (async () => {
        fetch(`${apiEndpoint}/notifyWallet/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
          },
          body: JSON.stringify({ serial, locale }),
        });
      })(),
    );
  };

const getQueryName = (query: string) => {
  const queryName = /query\s*(\S+)\s*[{(]/g.exec(query)?.[1];
  if (!queryName) {
    return `Unnamed query`;
  }
  return queryName;
};
