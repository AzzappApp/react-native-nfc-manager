import createPost from './createPost';
import createPostComment from './createPostComment';
import createProfile from './createProfile';
import deleteModules from './deleteModules';
import deletePostComment from './deletePostComment';
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
import reorderModules from './reorderModules';
import saveCardColors from './saveCardColors';
import saveCardStyle from './saveCardStyle';
import saveContactCard from './saveContactCard';
import saveCover from './saveCover';
import toggleFollowing from './toggleFollowing';
import updateModulesVisibility from './updateModulesVisibility';
import updatePost from './updatePost';
import updateProfile from './updateProfile';
import {
  updateContactcardScans,
  updateLikes,
  updateWebcardViews,
} from './updateStatistic';
import updateUser from './updateUser';
import type { MutationResolvers } from '#schema/__generated__/types';

export const Mutation: MutationResolvers = {
  createPost,
  createProfile,
  createPostComment,
  deleteModules,
  deletePostComment,
  duplicateModule,
  loadCardTemplate,
  publishCard,
  removeFollower,
  reorderModules,
  saveSimpleTextModule,
  saveLineDividerModule,
  saveHorizontalPhotoModule,
  saveCarouselModule,
  savePhotoWithTextAndTitleModule,
  saveSimpleButtonModule,
  saveSocialLinksModule,
  saveBlockTextModule,
  saveCardColors,
  saveCardStyle,
  saveContactCard,
  saveCover,
  toggleFollowing,
  updateContactcardScans,
  togglePostReaction,
  updateLikes,
  updatePost,
  updateProfile,
  updateUser,
  updateWebcardViews,
  updateModulesVisibility,
};
