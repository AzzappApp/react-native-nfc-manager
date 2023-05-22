import { GraphQLSchema } from 'graphql';
import { CardModulesGraphql } from './CardModuleGraphql';
import { MediaImageGraphQL, MediaVideoGraphql } from './MediaGraphQL';
import MutationGraphQL from './mutations';
import QueryGraphQL from './QueryGraphQL';

const schema = new GraphQLSchema({
  query: QueryGraphQL,
  mutation: MutationGraphQL,
  types: [MediaVideoGraphql, MediaImageGraphQL, ...CardModulesGraphql],
});

export default schema;
