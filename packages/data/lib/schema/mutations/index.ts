import { GraphQLObjectType } from 'graphql';
import createPost from './createPost';
import toggleFollowing from './toggleFollowing';
import updateCover from './updateCover';

const MutationGraphQL = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateCover,
    createPost,
    toggleFollowing,
  },
});

export default MutationGraphQL;
