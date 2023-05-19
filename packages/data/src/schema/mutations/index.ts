import { GraphQLObjectType } from 'graphql';
import createPost from './createPost';
import togglePostReaction from './postReaction';
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
    togglePostReaction,
  },
});

export default MutationGraphQL;
