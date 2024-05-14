/* eslint-disable react-hooks/rules-of-hooks */
import { useLogger, useErrorHandler } from '@envelop/core';
import { useParserCache } from '@envelop/parser-cache';
import { useValidationCache } from '@envelop/validation-cache';
import { maxAliasesPlugin } from '@escape.tech/graphql-armor-max-aliases';
import { maxTokensPlugin } from '@escape.tech/graphql-armor-max-tokens';
import {
  createYoga,
  type YogaLogger,
  type LogLevel,
  type Plugin,
  type FetchAPI,
} from 'graphql-yoga';
import {
  getDatabaseConnectionsInfos,
  startDatabaseConnectionMonitoring,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';

import ERRORS from '@azzapp/shared/errors';

import { createGraphQLContext, createLoaders } from '#GraphQLContext';
import { schema } from './schema';
import type { GraphQLContext } from '#GraphQLContext';
import type { WebCard } from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';
import type { GraphQLError } from 'graphql';

type CreateEndpointOptions = {
  logging?: LogLevel | YogaLogger | boolean;
  plugins?: Plugin[];
  notifyUsers: GraphQLContext['notifyUsers'];
  validateMailOrPhone: (
    type: 'email' | 'phone',
    issuer: string,
    token: string,
  ) => Promise<void>;
  buildCoverAvatarUrl: (webCard: WebCard | null) => Promise<string | null>;
  fetchAPI?: Partial<Record<keyof FetchAPI, any>>;
  graphqlEndpoint?: string;
};

export const createGraphqlEndpoint = (options: CreateEndpointOptions) => {
  const plugins = options.plugins ?? [];

  return createYoga({
    graphqlEndpoint: options.graphqlEndpoint,
    schema,
    fetchAPI: options.fetchAPI,
    logging: options.logging,
    graphiql: process.env.NODE_ENV !== 'production',
    batching: {
      limit: 5,
    },
    plugins: [
      ...plugins,
      useParserCache(),
      useValidationCache(),
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
          .filter(
            err =>
              (err as GraphQLError).extensions?.code !== ERRORS.INVALID_TOKEN,
          )
          .map(err => console.error(err));
      }),

      maxAliasesPlugin({
        n: 50, // Number of aliases allowed
        allowList: ['node', 'uri'],
      }),
      maxTokensPlugin({
        n: 1000, // Number of tokens allowed
      }),
    ],
    context: ({ request }) => {
      const locale = request.headers.get('azzapp-locale') as Locale;

      const loaders = createLoaders();

      return createGraphQLContext(
        options.notifyUsers,
        options.validateMailOrPhone,
        options.buildCoverAvatarUrl,
        loaders,
        locale ?? DEFAULT_LOCALE,
      );
    },
  });
};
