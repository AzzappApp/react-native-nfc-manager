import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '#schema/__generated__/types';
import resolvers from './schema';
import { createGraphQLContext } from './schema/GraphQLContext';
import type { GraphQLContext } from './schema/GraphQLContext';

const buildSchema = () => {
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
};

const schema = buildSchema();

export { schema, createGraphQLContext };

export type { GraphQLContext };
