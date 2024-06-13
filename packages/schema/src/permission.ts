import { GraphQLError } from 'graphql';
import { shield, rule, allow, or } from 'graphql-shield';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin, isEditor, isOwner } from '@azzapp/shared/profileHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { ProfileRole, Mutation } from '#__generated__/types';
import type { GraphQLContext } from './GraphQLContext';
import type { Profile, User, WebCard } from '@azzapp/data';
import type { IRule } from 'graphql-shield';

const hasRole = (
  key: string,
  checkRole: (p: ProfileRole) => boolean,
  acceptInvited?: boolean,
) =>
  rule(`hasRole-${key}`, {
    cache: 'contextual',
  })(async (_parent: any, args: any, ctx: GraphQLContext) => {
    const { userId } = ctx.auth;
    if ('webCardId' in args && typeof args.webCardId === 'string') {
      const webCardId = fromGlobalIdWithType(args.webCardId, 'WebCard');
      const profile =
        userId &&
        (await ctx.loaders.profileByWebCardIdAndUserId.load({
          userId,
          webCardId,
        }));

      const user = userId ? await ctx.loaders.User.load(userId) : null;

      if (
        !profile ||
        !checkRole(profile.profileRole) ||
        (profile.invited && !acceptInvited) ||
        profile.deleted ||
        user?.deleted
      ) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }
    } else if ('profileId' in args && typeof args.profileId === 'string') {
      const profileId = fromGlobalIdWithType(args.profileId, 'Profile');
      const profile = profileId && (await ctx.loaders.Profile.load(profileId));

      const user = userId ? await ctx.loaders.User.load(userId) : null;

      if (
        !profile ||
        !checkRole(profile.profileRole) ||
        (profile.invited && !acceptInvited) ||
        profile.deleted ||
        user?.deleted
      ) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }

      if (profile.userId !== ctx.auth.userId) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }
    } else if ('userId' in args && typeof args.userId === 'string') {
      const userId = args.userId;
      const user = userId && (await ctx.loaders.User.load(userId));

      if (!user) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }

      if (userId !== ctx.auth.userId) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }
    } else {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    return true;
  });

const isAdminRule = hasRole('admin', isAdmin);
const isEditorRule = hasRole('editor', isEditor);
const isOwnerRule = hasRole('owner', isOwner);
const isAnyRoleRule = hasRole('any', () => true, true);

type MutationMethod = Exclude<keyof Mutation, '__typename'>;

const isCurrentProfileRule = rule('sameUserProfile', {
  cache: 'contextual',
})(async (parent: Profile, _args, ctx: GraphQLContext) => {
  return ctx.auth.userId === parent.userId;
});

const ProtectedMutation: Record<
  Exclude<
    MutationMethod,
    | 'createWebCard'
    | 'deleteUser'
    | 'estimateSubscriptionCost'
    | 'sendReport'
    | 'updateContactCardScans'
    | 'updateProfile'
    | 'updateUser'
    | 'updateWebCardViews'
  >,
  IRule
> = {
  inviteUser: isAdminRule,
  inviteUsersList: isAdminRule,
  loadCardTemplate: isEditorRule,
  acceptInvitation: isAnyRoleRule,
  createPost: isEditorRule,
  createPostComment: isEditorRule,
  declineOwnership: isAnyRoleRule,
  deleteModules: isEditorRule,
  deletePostComment: isEditorRule,
  deletePost: isEditorRule,
  duplicateModule: isEditorRule,
  saveSimpleTextModule: isEditorRule,
  saveLineDividerModule: isEditorRule,
  saveHorizontalPhotoModule: isEditorRule,
  saveCarouselModule: isEditorRule,
  savePhotoWithTextAndTitleModule: isEditorRule,
  saveSimpleButtonModule: isEditorRule,
  saveSocialLinksModule: isEditorRule,
  saveBlockTextModule: isEditorRule,
  togglePostReaction: isEditorRule,
  quitWebCard: isAnyRoleRule,
  removeFollower: isEditorRule,
  removeUsersFromWebCard: isAdminRule,
  reorderModules: isEditorRule,
  saveCardColors: isEditorRule,
  acceptOwnership: isAnyRoleRule,
  saveCardStyle: isEditorRule,
  saveCommonInformation: isAdminRule,
  saveSubscription: isAnyRoleRule,
  cancelTransferOwnership: isOwnerRule,
  saveContactCard: isAnyRoleRule,
  saveCover: isEditorRule,
  toggleFollowing: isEditorRule,
  toggleWebCardPublished: isAdminRule,
  transferOwnership: isOwnerRule,
  updateModulesVisibility: isEditorRule,
  updateMultiUser: isOwnerRule,
  updatePost: isEditorRule,
  updatePostComment: isEditorRule,
  updateWebCardUserName: isAdminRule,
  updateWebCard: isEditorRule,
  sendInvitations: isAdminRule,
  createPaymentIntent: isOwnerRule,
  createSubscriptionFromPaymentMean: isOwnerRule,
  createPaymentMean: isOwnerRule,
  updateSubscription: isOwnerRule,
  generatePaymentInvoice: isOwnerRule,
  upgradeSubscriptionPlan: isOwnerRule,
  endSubscription: isOwnerRule,
  updateSubscriptionCustomer: isAdminRule,
};

const isCurrentUserRule = rule('sameUser', {
  cache: 'contextual',
})(async (parent: User, _args, ctx: GraphQLContext) => {
  console.log(ctx.auth.userId, parent.id);
  return ctx.auth.userId === parent.id;
});

const isSameWebCard = rule('sameWebCard', {
  cache: 'contextual',
})(async (parent: Profile, _args, ctx: GraphQLContext) => {
  const userProfile = ctx.auth.userId
    ? await ctx.loaders.profileByWebCardIdAndUserId.load({
        userId: ctx.auth.userId,
        webCardId: parent.webCardId,
      })
    : null;

  const isSameWebCard = userProfile?.webCardId === parent.webCardId;

  return isSameWebCard;
});

const isCurrentWebCardRule = rule('sameUserWebCard', {
  cache: 'contextual',
})(async (parent: WebCard, _args, ctx: GraphQLContext) => {
  const userProfile = ctx.auth.userId
    ? await ctx.loaders.profileByWebCardIdAndUserId.load({
        userId: ctx.auth.userId,
        webCardId: parent.id,
      })
    : null;

  return userProfile !== null;
});

const permissions = shield(
  {
    Mutation: ProtectedMutation,
    User: {
      '*': isCurrentUserRule,
      email: allow,
      phoneNumber: allow,
      id: or(isCurrentUserRule, isSameWebCard),
    },
    Profile: {
      '*': isCurrentProfileRule,
      contactCard: or(isCurrentProfileRule, isSameWebCard),
      user: or(isCurrentProfileRule, isSameWebCard),
      avatar: or(isCurrentProfileRule, isSameWebCard),
      promotedAsOwner: or(isCurrentProfileRule, isSameWebCard),
      invited: or(isCurrentProfileRule, isSameWebCard),
      statsSummary: or(isCurrentProfileRule, isSameWebCard),
      nbContactCardScans: or(isCurrentProfileRule, isSameWebCard),
      profileRole: or(isCurrentProfileRule, isSameWebCard),
      id: or(isCurrentProfileRule, isSameWebCard),
      webCard: or(isCurrentProfileRule, isSameWebCard),
      inviteSent: or(isCurrentProfileRule, isSameWebCard),
      logo: or(isCurrentProfileRule, isSameWebCard),
    },
    WebCard: {
      '*': isCurrentWebCardRule,
      logo: isSameWebCard,
      profilePendingOwner: isSameWebCard,
      profiles: isSameWebCard,
      nbProfiles: isSameWebCard,
      owner: isSameWebCard,
      userName: allow,
      cardIsPublished: allow,
      hasCover: allow,
      coverMedia: allow,
      coverTexts: allow,
      coverBackgroundColor: allow,
      cardColors: allow,
      cardStyle: allow,
      cardModules: allow,
      isFollowing: allow,
      posts: allow,
      nbPosts: allow,
      nbFollowers: allow,
      nbFollowings: allow,
      id: allow,
      webCardKind: allow,
      coverDynamicLinks: allow,
      isPremium: isSameWebCard,
      requiresSubscription: isSameWebCard,
    },
  },
  {
    allowExternalErrors: true,
    fallbackError: new GraphQLError(ERRORS.FORBIDDEN),
  },
);

export default permissions;
