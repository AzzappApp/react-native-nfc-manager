import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { DateTimeResolver } from 'graphql-scalars';
import { applyDirectiveSchemaTransform, directivesTypeDefs } from '#directives';
import {
  asyncLocalStorageContextMiddleware,
  resetSessionResourceAfterMutationMiddleware,
} from '#GraphQLContext';
import { typeDefs } from '#/__generated__/types';
import MutationResolvers from './mutation';
import QueryResolvers from './query';
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

const schema = applyMiddleware(
  applyDirectiveSchemaTransform(buildSchema()),
  asyncLocalStorageContextMiddleware,
  resetSessionResourceAfterMutationMiddleware,
);

export default schema;
