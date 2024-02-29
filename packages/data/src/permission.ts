import { GraphQLError } from 'graphql';
import { shield, rule } from 'graphql-shield';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin, isEditor, isOwner } from '@azzapp/shared/profileHelpers';
import { getUserProfileWithWebCardId } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { ProfileRole, Mutation } from '#schema/__generated__/types';
import type { GraphQLContext } from './schema/GraphQLContext';
import type { IRule } from 'graphql-shield';

const hasRole = (
  key: string,
  checkRole: (p: ProfileRole) => boolean,
  acceptInvited?: boolean,
) =>
  rule(`hasRole-${key}`, {
    cache: 'strict',
  })(async (parent, args, ctx: GraphQLContext, _info) => {
    if ('webCardId' in args && typeof args.webCardId === 'string') {
      const { userId } = ctx.auth;
      const webCardId = fromGlobalIdWithType(args.webCardId, 'WebCard');
      const profile =
        userId && (await getUserProfileWithWebCardId(userId, webCardId));

      if (
        !profile ||
        !checkRole(profile.profileRole) ||
        (profile.invited && !acceptInvited)
      ) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }
    } else if ('profileId' in args && typeof args.profileId === 'string') {
      const profileId = fromGlobalIdWithType(args.profileId, 'Profile');
      const profile = profileId && (await ctx.loaders.Profile.load(profileId));
      if (
        !profile ||
        !checkRole(profile.profileRole) ||
        (profile.invited && !acceptInvited)
      ) {
        throw new GraphQLError(ERRORS.FORBIDDEN);
      }

      if (profile.userId !== ctx.auth.userId) {
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

const ProtectedMutation: Record<
  Exclude<
    MutationMethod,
    | 'createWebCard'
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
  declineInvitation: isAnyRoleRule,
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
  removeUserFromWebCard: isAdminRule,
  reorderModules: isEditorRule,
  saveCardColors: isEditorRule,
  acceptOwnership: isAnyRoleRule,
  saveCardStyle: isEditorRule,
  saveCommonInformation: isAdminRule,
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
};

const permissions = shield(
  {
    Mutation: ProtectedMutation,
  },
  {
    allowExternalErrors: true,
  },
);

export default permissions;
