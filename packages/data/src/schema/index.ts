import { GraphQLSchema } from 'graphql';
import MutationGraphQL from './mutations';
import QueryGraphQL from './QueryGraphQL';

const schema = new GraphQLSchema({
  query: QueryGraphQL,
  mutation: MutationGraphQL,
});

export default schema;
