import { GraphQLObjectType } from 'graphql';
import createPost from './createPost';
import createPostComment from './createPostComment';
import deleteModules from './deleteModules';
import duplicateModule from './duplicateModule';
import togglePostReaction from './postReaction';
import removeFollower from './removeFollower';
import saveCarouselModule from './saveCarouselModule';
import saveHorizontalPhotoModule from './saveHorizontalPhotoModule';
import saveLineDividerModule from './saveLineDividerModule';
import savePhotoWithTextAndTitleModule from './savePhotoWithTextAndTitleModule';
import saveSimpleButtonModule from './saveSimpleButtonModule';
import saveSimpleTextModule from './saveSimpleTextModule';
import swapModules from './swapModules';
import toggleFollowing from './toggleFollowing';
import updateCard from './updateCard';
import updateCover from './updateCover';
import updateModulesVisibility from './updateModulesVisibility';
import updateProfile from './updateProfile';

const MutationGraphQL = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateProfile,
    updateCover,
    createPost,
    toggleFollowing,
    removeFollower,
    togglePostReaction,
    saveSimpleTextModule,
    saveLineDividerModule,
    saveHorizontalPhotoModule,
    saveCarouselModule,
    savePhotoWithTextAndTitleModule,
    updateCard,
    saveSimpleButtonModule,
    swapModules,
    deleteModules,
    duplicateModule,
    updateModulesVisibility,
    createPostComment,
  },
});

export default MutationGraphQL;
