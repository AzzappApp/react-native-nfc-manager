import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { applyDirectiveSchemaTransform, directivesTypeDefs } from '#directives';
import {
  asyncLocalStorageContextMiddleware,
  resetSessionResourceAfterMutationMiddleware,
  runOnPrimaryMiddleware,
} from '#GraphQLContext';
import { typeDefs } from './__generated__/types';
import MutationResolvers from './mutation';
import QueryResolvers from './query';
import type { Resolvers } from './__generated__/types';

const resolvers: Resolvers = {
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
  runOnPrimaryMiddleware,
);

export default schema;
