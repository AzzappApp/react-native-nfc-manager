import schema from './schema';
import { createGraphQLContext } from './schema/GraphQLContext';
import type { GraphQLContext } from './schema/GraphQLContext';

export { schema as graphQLSchema, createGraphQLContext };

export type { GraphQLContext };
