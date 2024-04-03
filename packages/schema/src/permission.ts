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
    if ('webCardId' in args && typeof args.webCardId === 'string') {
      const { userId } = ctx.auth;
      if (!userId) {
        throw new GraphQLError(ERRORS.UNAUTHORIZED);
      }
      const webCardId = fromGlobalIdWithType(args.webCardId, 'WebCard');
      const profile = await ctx.loaders.profileByWebCardIdAndUserId.load({
        userId,
        webCardId,
      });

      if (
        !profile ||
        !checkRole(profile.profileRole) ||
        (profile.invited && !acceptInvited)
      ) {
        throw new GraphQLError(ERRORS.FORBIDDEN, {
          extensions: { role: profile?.profileRole },
        });
      }
    } else if ('profileId' in args && typeof args.profileId === 'string') {
      const profileId = fromGlobalIdWithType(args.profileId, 'Profile');
      const profile = await ctx.loaders.Profile.load(profileId);
      if (
        !profile ||
        !checkRole(profile.profileRole) ||
        (profile.invited && !acceptInvited)
      ) {
        throw new GraphQLError(ERRORS.FORBIDDEN, {
          extensions: { role: profile?.profileRole },
        });
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
const isNotOwnerRule = hasRole('notOwner', role => role !== 'owner', true);

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
  quitWebCard: isNotOwnerRule,
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
};

const isCurrentUserRule = rule('sameProfile', {
  cache: 'contextual',
})(async (parent: User, _args, ctx: GraphQLContext) => {
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
      '*': allow,
      email: allow,
      phoneNumber: allow,
      userSubscription: allow,
      publishedWebCards: allow,
      id: or(isCurrentUserRule, isSameWebCard),
    },
    Profile: {
      '*': isCurrentProfileRule,
      contactCard: or(isCurrentUserRule, isSameWebCard),
      user: or(isCurrentUserRule, isSameWebCard),
      avatar: or(isCurrentUserRule, isSameWebCard),
      promotedAsOwner: or(isCurrentUserRule, isSameWebCard),
      invited: or(isCurrentUserRule, isSameWebCard),
      statsSummary: or(isCurrentUserRule, isSameWebCard),
      nbContactCardScans: or(isCurrentUserRule, isSameWebCard),
      profileRole: or(isCurrentUserRule, isSameWebCard),
      id: or(isCurrentUserRule, isSameWebCard),
      webCard: or(isCurrentUserRule, isSameWebCard),
      inviteSent: or(isCurrentUserRule, isSameWebCard),
    },
    WebCard: {
      '*': isCurrentWebCardRule,
      profilePendingOwner: isSameWebCard,
      profiles: isSameWebCard,
      nbProfiles: isSameWebCard,
      owner: isSameWebCard,
      userName: allow,
      cardIsPublished: allow,
      cardCover: allow,
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
    },
  },
  {
    allowExternalErrors: true,
  },
);

export default permissions;
