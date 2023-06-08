import { fromGlobalId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import {
  deletePostReaction,
  getPostReaction,
  insertPostReaction,
} from '#domains/postReactions';
import type { MutationResolvers } from '#schema/__generated__/types';

const togglePostReaction: MutationResolvers['togglePostReaction'] = async (
  _,
  { input },
  { auth, postLoader },
) => {
  if (auth.isAnonymous) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(input.postId);
  if (type !== 'Post') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    const reaction = await getPostReaction(profileId, targetId);
    if (reaction && reaction.reactionKind === input.reactionKind) {
      await deletePostReaction(profileId, targetId);
    } else if (input.reactionKind) {
      await insertPostReaction(profileId, targetId, input.reactionKind);
    }
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  //have to refetch because Kysely/planetscale doesn't support returning
  const post = await postLoader.load(targetId);

  return post ? { post } : null;
};

export default togglePostReaction;
