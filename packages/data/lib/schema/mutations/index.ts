import { GraphQLObjectType } from 'graphql';
import createPost from './createPost';
import toggleFollowing from './toggleFollowing';
import updateCover from './updateCover';
import updateUser from './updateUser';

const MutationGraphQL = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateUser,
    updateCover,
    createPost,
    toggleFollowing,
  },
});

export default MutationGraphQL;
