import createPost from './createPost';
import createPostComment from './createPostComment';
import createProfile from './createProfile';
import deleteModules from './deleteModules';
import duplicateModule from './duplicateModule';
import loadCardTemplate from './loadCardTemplate';
import {
  saveBlockTextModule,
  saveCarouselModule,
  saveHorizontalPhotoModule,
  saveLineDividerModule,
  savePhotoWithTextAndTitleModule,
  saveSimpleButtonModule,
  saveSimpleTextModule,
  saveSocialLinksModule,
} from './ModulesMutationsResolvers';
import togglePostReaction from './postReaction';
import publishCard from './publishCard';
import removeFollower from './removeFollower';
import saveCardColors from './saveCardColors';
import saveCardStyle from './saveCardStyle';
import saveContactCard from './saveContactCard';
import saveCover from './saveCover';
import swapModules from './swapModules';
import toggleFollowing from './toggleFollowing';
import updateModulesVisibility from './updateModulesVisibility';
import updatePost from './updatePost';
import updateProfile from './updateProfile';
import updateUser from './updateUser';
import type { MutationResolvers } from '#schema/__generated__/types';

export const Mutation: MutationResolvers = {
  updateProfile,
  updateUser,
  createPost,
  createProfile,
  updatePost,
  toggleFollowing,
  removeFollower,
  togglePostReaction,
  saveSimpleTextModule,
  saveLineDividerModule,
  saveHorizontalPhotoModule,
  saveCarouselModule,
  savePhotoWithTextAndTitleModule,
  saveSimpleButtonModule,
  saveSocialLinksModule,
  saveBlockTextModule,
  swapModules,
  deleteModules,
  duplicateModule,
  loadCardTemplate,
  updateModulesVisibility,
  createPostComment,
  saveCardColors,
  saveCardStyle,
  saveContactCard,
  saveCover,
  publishCard,
};
