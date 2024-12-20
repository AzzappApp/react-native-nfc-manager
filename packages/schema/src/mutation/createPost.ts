import { GraphQLError } from 'graphql';
import {
  checkMedias,
  createPost,
  incrementWebCardPosts,
  referencesMedias,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const createPostMutation: MutationResolvers['createPost'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: { mediaId, content, allowComments, allowLikes },
  },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  if (!mediaId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await checkWebCardProfileEditorRight(webCardId);

  try {
    await checkMedias([mediaId]);

    const post = await transaction(async () => {
      await referencesMedias([mediaId], null);
      const newPost = {
        webCardId,
        content,
        allowComments,
        allowLikes,
        medias: [mediaId],
        counterReactions: 0,
        counterComments: 0,
      };

      const postId = await createPost(newPost);
      await incrementWebCardPosts(webCardId);

      return {
        ...newPost,
        id: postId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        deletedBy: null,
        deletedAt: null,
      };
    });

    const webCard = await webCardLoader.load(webCardId);
    if (webCard?.userName) {
      invalidateWebCard(webCard.userName);
    }
    return { post };
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createPostMutation;
