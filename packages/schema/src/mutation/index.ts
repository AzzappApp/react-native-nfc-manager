import acceptInvitation from './acceptInvitation';
import acceptOwnership from './acceptOwnership';
import addContact from './addContact';
import cancelTransferOwnership from './cancelTransferOwnership';
import createPost from './createPost';
import createPostCommentMutation from './createPostComment';
import createWebCard from './createWebCard';
import declineOwnership from './declineOwnership';
import deleteFCMToken from './deleteFCMToken';
import deleteModules from './deleteModules';
import deletePost from './deletePost';
import deletePostComment from './deletePostComment';
import deleteUser from './deleteUser';
import duplicateModule from './duplicateModule';
import inviteUser from './inviteUser';
import inviteUsersList from './inviteUsersList';
import loadCardTemplate from './loadCardTemplate';
import {
  saveBlockTextModule,
  saveCarouselModule,
  saveHorizontalPhotoModule,
  saveLineDividerModule,
  saveMediaModule,
  saveMediaTextModule,
  saveMediaTextLinkModule,
  savePhotoWithTextAndTitleModule,
  saveSimpleButtonModule,
  saveSimpleTextModule,
  saveSocialLinksModule,
} from './ModulesMutationsResolvers';
import {
  createPaymentIntent,
  createPaymentMean,
  createSubscriptionFromPaymentMean,
  endSubscription,
  estimateSubscriptionCost,
  generatePaymentInvoice,
  renewSubscription,
  updateSubscription,
  updateSubscriptionCustomer,
  upgradeSubscriptionPlan,
} from './payment';
import togglePostReaction from './postReaction';
import quitWebCard from './quitWebCard';
import removeContacts from './removeContacts';
import removeContactsFromWebCard from './removeContactsFromWebCard';
import removeFollower from './removeFollower';
import removeUsersFromWebCard from './removeUsersFromWebCard';
import reorderModules from './reorderModules';
import saveCardColors from './saveCardColors';
import saveCardStyle from './saveCardStyle';
import saveCommonInformation from './saveCommonInformation';
import saveContactCard from './saveContactCard';
import saveCover from './saveCover';
import saveFCMToken from './saveFCMToken';
import sendInvitations from './sendInvitations';
import sendReport from './sendReport';
import toggleFollowing from './toggleFollowing';
import toggleWebCardPublished from './toggleWebCardPublished';
import transferOwnership from './transferOwnership';
import updateContactsLastView from './updateContactsLastView';
import updateModulesVisibility from './updateModulesVisibility';
import updateMultiUser from './updateMultiUser';
import updatePost from './updatePost';
import updateProfile from './updateProfile';
import { updateContactCardScans, updateWebCardViews } from './updateStatistic';
import updateUser from './updateUser';
import updateWebCard from './updateWebCard';
import updateWebCardUserName from './updateWebCardUserName';
import type { MutationResolvers } from '#/__generated__/types';

export const Mutation: MutationResolvers = {
  createPost,
  createWebCard,
  createPostComment: createPostCommentMutation,
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
  saveMediaModule,
  saveMediaTextModule,
  saveMediaTextLinkModule,
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
  sendReport,
  createPaymentIntent,
  createPaymentMean,
  createSubscriptionFromPaymentMean,
  estimateSubscriptionCost,
  generatePaymentInvoice,
  updateSubscription,
  upgradeSubscriptionPlan,
  endSubscription,
  deletePost,
  updateSubscriptionCustomer,
  renewSubscription,
  deleteUser,
  addContact,
  removeContacts,
  removeContactsFromWebCard,
  saveFCMToken,
  deleteFCMToken,
  updateContactsLastView,
};

export default Mutation;
