import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { applyDirectiveSchemaTransform, directivesTypeDefs } from '#directives';
import permissions from '#permission';
import { typeDefs } from '#schema/__generated__/types';
import resolvers from './schema';
import { createGraphQLContext } from './schema/GraphQLContext';
import type { GraphQLContext } from './schema/GraphQLContext';

const buildSchema = () => {
  return makeExecutableSchema({
    typeDefs: [directivesTypeDefs, typeDefs],
    resolvers,
  });
};

const schema = applyMiddleware(
  applyDirectiveSchemaTransform(buildSchema()),
  permissions,
);

export { schema, createGraphQLContext };

export type { GraphQLContext };
