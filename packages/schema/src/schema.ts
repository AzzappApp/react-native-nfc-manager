import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { DateTimeResolver } from 'graphql-scalars';
import { applyDirectiveSchemaTransform, directivesTypeDefs } from '#directives';
import {
  asyncLocalStorageContextMiddleware,
  resetSessionResourceAfterMutationMiddleware,
} from '#GraphQLContext';
import { typeDefs } from '#/__generated__/types';
import performanceLoggingMiddleware, {
  isPerformanceLoggingEnabled,
  getPerformanceLogs,
  startPerformanceLogging,
} from '#helpers/performanceLoggingMiddleware';
import MutationResolvers from './mutation';
import QueryResolvers from './query';
import type {
  GQLPerformanceInfos,
  FieldLog,
} from '#helpers/performanceLoggingMiddleware';
import type { Resolvers } from './__generated__/types';

const resolvers: Resolvers = {
  DateTime: DateTimeResolver,
  Mutation: MutationResolvers,
  ...QueryResolvers,
};

const buildSchema = () => {
  return makeExecutableSchema({
    typeDefs: [directivesTypeDefs, typeDefs],
    resolvers,
  });
};

const middlewares = [
  asyncLocalStorageContextMiddleware,
  resetSessionResourceAfterMutationMiddleware,
  isPerformanceLoggingEnabled() ? performanceLoggingMiddleware : undefined,
].filter(middleware => middleware !== undefined);

const schema = applyMiddleware(
  applyDirectiveSchemaTransform(buildSchema()),
  ...middlewares,
);

export default schema;

export {
  isPerformanceLoggingEnabled,
  getPerformanceLogs,
  startPerformanceLogging,
};

export type { GQLPerformanceInfos, FieldLog };
