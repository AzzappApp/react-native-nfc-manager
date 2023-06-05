import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { createMedia, createPost, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostMutation: MutationResolvers['createPost'] = async (
  _,
  { input: { media, content, allowComments, allowLikes } },
  { auth },
) => {
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  try {
    const post = await db.transaction().execute(async trx => {
      await createMedia(media, trx);
      const post = await createPost(
        {
          authorId: profileId,
          content,
          allowComments,
          allowLikes,
          medias: [media.id],
          counterReactions: 0,
          counterComments: 0,
        },
        trx,
      );

      return post;
    });
    return { post };
  } catch {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createPostMutation;
