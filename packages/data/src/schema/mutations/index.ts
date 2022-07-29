import { GraphQLObjectType } from 'graphql';
import createPost from './createPost';
import updateCover from './updateCover';

const MutationGraphQL = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateCover,
    createPost,
  },
});

export default MutationGraphQL;
