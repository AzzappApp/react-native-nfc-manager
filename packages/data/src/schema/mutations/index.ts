import { GraphQLObjectType } from 'graphql';
import updateCover from './updateCover';

const MutationGraphQL = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateCover,
  },
});

export default MutationGraphQL;
