import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { getPostCommentById, updatePostComment } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updatePostCommentMutation: MutationResolvers['updatePostComment'] =
  async (_, { input: { commentId, comment } }, { auth, loaders }) => {
    const { profileId } = auth;

    let profile: Profile | null = null;
    try {
      if (profileId) {
        profile = await loaders.Profile.load(profileId);
      }
    } catch (e) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!profile || !isEditor(profile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const { id: targetId, type } = fromGlobalId(commentId);
    if (type !== 'PostComment' || !comment) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    try {
      const originalComment = await getPostCommentById(targetId);
      if (!originalComment) throw new GraphQLError(ERRORS.INVALID_REQUEST);
      if (originalComment.webCardId !== profile?.webCardId)
        throw new GraphQLError(ERRORS.FORBIDDEN);

      await updatePostComment(targetId, comment);

      return {
        postComment: {
          ...originalComment,
          comment,
        },
      };
    } catch (error) {
      console.error(error);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default updatePostCommentMutation;
