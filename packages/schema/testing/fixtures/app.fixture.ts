/* eslint-disable react-hooks/rules-of-hooks */
import { UnauthenticatedError, useGenericAuth } from '@envelop/generic-auth';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { parse } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { verifyToken, generateTokens } from '@azzapp/web/src/helpers/tokens';
import queryMap from '@azzapp/web/src/persisted-query-map.json';

import { createGraphqlEndpoint } from '../../src/endpoint';
import { loadFixtures } from './e2e-app.fixture';
import type { Fixtures } from './e2e-app.fixture';
import type { Plugin } from 'graphql-yoga';

type ExecutorProps = {
  query: string;
  variables: Record<string, unknown>;
  extensions?: {
    headers?: {
      authorization: string;
    };
  };
};

export const createAppFixture = () => {
  const yoga = createGraphqlEndpoint({
    buildCoverAvatarUrl: webcard => Promise.resolve(webcard?.userName ?? null),
    sendMail: () => Promise.resolve(),
    sendSms: () => Promise.resolve(),
    plugins: [
      usePersistedOperations({
        extractPersistedOperationId: params => {
          return 'id' in params && params.id ? (params.id as string) : null;
        },
        getPersistedOperation(id: string) {
          return (queryMap as any)[id];
        },
        allowArbitraryOperations: () => {
          return true;
        },
      }),
      useGenericAuth({
        resolveUserFn: async context => {
          const token = (context as any).request?.headers?.get?.(
            'authorization',
          );

          if (token) {
            try {
              const { userId } = await verifyToken(token);
              return { userId };
            } catch (e) {
              throw new Error(ERRORS.INVALID_TOKEN);
            }
          }
          return null;
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
      }) as Plugin,
    ],
  });

  const executor = buildHTTPExecutor({
    fetch: yoga.fetch,
  });

  return {
    executor: (props: ExecutorProps) => {
      return executor({
        document: parse(props.query),
        extensions: props.extensions,
        variables: props.variables,
      });
    },
    load: (fixtures: Fixtures) => loadFixtures(fixtures),
    generateTokens,
  };
};
