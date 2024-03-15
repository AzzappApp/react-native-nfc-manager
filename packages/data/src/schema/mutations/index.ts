import acceptInvitation from './acceptInvitation';
import acceptOwnership from './acceptOwnership';
import cancelTransferOwnership from './cancelTransferOwnership';
import createPost from './createPost';
import createPostComment from './createPostComment';
import createWebCard from './createWebCard';
import declineOwnership from './declineOwnership';
import deleteModules from './deleteModules';
import deletePostComment from './deletePostComment';
import duplicateModule from './duplicateModule';
import inviteUser from './inviteUser';
import inviteUsersList from './inviteUsersList';
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
import quitWebCard from './quitWebCard';
import removeFollower from './removeFollower';
import removeUsersFromWebCard from './removeUsersFromWebCard';
import reorderModules from './reorderModules';
import saveCardColors from './saveCardColors';
import saveCardStyle from './saveCardStyle';
import saveCommonInformation from './saveCommonInformation';
import saveContactCard from './saveContactCard';
import saveCover from './saveCover';
import sendInvitations from './sendInvitations';
import toggleFollowing from './toggleFollowing';
import toggleWebCardPublished from './toggleWebCardPublished';
import transferOwnership from './transferOwnership';
import updateModulesVisibility from './updateModulesVisibility';
import updateMultiUser from './updateMultiUser';
import updatePost from './updatePost';
import updateProfile from './updateProfile';
import { updateContactCardScans, updateWebCardViews } from './updateStatistic';
import updateUser from './updateUser';
import updateWebCard from './updateWebCard';
import updateWebCardUserName from './updateWebCardUserName';
import type { MutationResolvers } from '#schema/__generated__/types';

export const Mutation: MutationResolvers = {
  createPost,
  createWebCard,
  createPostComment,
  deleteModules,
  deletePostComment,
  duplicateModule,
  loadCardTemplate,
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
  togglePostReaction,
  toggleWebCardPublished,
  updateContactCardScans,
  updatePost,
  updateWebCard,
  updateUser,
  updateWebCardViews,
  updateModulesVisibility,
  acceptInvitation,
  saveCommonInformation,
  updateMultiUser,
  acceptOwnership,
  declineOwnership,
  updateWebCardUserName,
  updateProfile,
  inviteUser,
  removeUsersFromWebCard,
  transferOwnership,
  cancelTransferOwnership,
  quitWebCard,
  inviteUsersList,
  sendInvitations,
};
