import { eq, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  WebCardTable,
  checkMedias,
  createPost,
  db,
  referencesMedias,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostMutation: MutationResolvers['createPost'] = async (
  _,
  { input: { mediaId, content, allowComments, allowLikes } },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (
    !profile ||
    !('profileRole' in profile && isEditor(profile.profileRole))
  ) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!mediaId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    await checkMedias([mediaId]);
    const post = await db.transaction(async trx => {
      await referencesMedias([mediaId], null, trx);
      await trx
        .update(WebCardTable)
        .set({
          nbPosts: sql`nbPosts + 1`,
        })
        .where(eq(WebCardTable.id, profile.webCardId));

      const newPost = {
        webCardId: profile.webCardId,
        content,
        allowComments,
        allowLikes,
        medias: [mediaId],
        counterReactions: 0,
        counterComments: 0,
      };

      const postId = await createPost(newPost, trx);

      return {
        ...newPost,
        id: postId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const webCard = await loaders.WebCard.load(profile.webCardId);

    if (webCard) {
      cardUsernamesToRevalidate.add(webCard.userName);
    }
    return { post };
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createPostMutation;
