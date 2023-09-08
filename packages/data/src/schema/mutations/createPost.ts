import { eq, sql } from 'drizzle-orm';
import ERRORS from '@azzapp/shared/errors';
import {
  ProfileTable,
  checkMedias,
  createPost,
  db,
  referencesMedias,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostMutation: MutationResolvers['createPost'] = async (
  _,
  { input: { mediaId, content, allowComments, allowLikes } },
  { auth, loaders, cardUpdateListener },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  if (!mediaId) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await checkMedias([mediaId]);
    const post = await db.transaction(async trx => {
      await referencesMedias([mediaId], null, trx);
      await trx
        .update(ProfileTable)
        .set({
          nbPosts: sql`nbPosts + 1`,
        })
        .where(eq(ProfileTable.id, profileId));
      const post = await createPost(
        {
          authorId: profileId,
          content,
          allowComments,
          allowLikes,
          medias: [mediaId],
          counterReactions: 0,
          counterComments: 0,
        },
        trx,
      );

      return post;
    });

    cardUpdateListener(profile.userName);
    return { post };
  } catch (error) {
    console.error(error);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createPostMutation;
