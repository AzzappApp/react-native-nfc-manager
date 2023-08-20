import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import {
  deletePostReaction,
  getPostReaction,
  insertPostReaction,
} from '#domains/postReactions';
import type { MutationResolvers } from '#schema/__generated__/types';

const togglePostReaction: MutationResolvers['togglePostReaction'] = async (
  _,
  { input: { postId, reactionKind } },
  { auth, postLoader },
) => {
  if (!auth.userId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const profileId = auth.profileId;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(postId);
  const post = await postLoader.load(targetId);
  if (type !== 'Post' || !post) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    const reaction = await getPostReaction(profileId, targetId);
    if (reaction && reaction.reactionKind === reactionKind) {
      await deletePostReaction(profileId, targetId);
    } else if (reactionKind) {
      await insertPostReaction(profileId, targetId, reactionKind);
    }
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { post };
};

export default togglePostReaction;
