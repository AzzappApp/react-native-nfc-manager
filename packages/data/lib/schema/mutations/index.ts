import { GraphQLObjectType } from 'graphql';
import createPost from './createPost';
import toggleFollowing from './toggleFollowing';
import updateCover from './updateCover';
import updateProfile from './updateProfile';

const MutationGraphQL = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateProfile,
    updateCover,
    createPost,
    toggleFollowing,
  },
});

export default MutationGraphQL;
