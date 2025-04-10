import { GraphQLError } from 'graphql';
import {
  checkMedias,
  getWebCardPosts,
  referencesMedias,
  transaction,
  updateWebCard,
  createId,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import {
  invalidatePost,
  invalidateWebCard,
  notifyWebCardUsers,
} from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { notifyRelatedWalletPasses } from '#helpers/webCardHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const saveCover: MutationResolvers['saveCover'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: {
      texts,
      mediaId,
      backgroundColor,
      cardColors,
      dynamicLinks,
      coverPreviewPositionPercentage,
      coverIsPredefined = false,
    },
  },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile = await checkWebCardProfileEditorRight(webCardId);

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!texts || !mediaId || !backgroundColor) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  let updatedWebCard = {
    ...webCard,
    updatedAt: new Date(),
  };
  try {
    await checkMedias([mediaId]);
    await transaction(async () => {
      await referencesMedias(
        [mediaId],
        webCard.coverMediaId ? [webCard.coverMediaId] : null,
      );
      const updates: Partial<WebCard> = {
        lastCardUpdate: new Date(),
        coverMediaId: mediaId,
        coverBackgroundColor: backgroundColor,
        cardColors,
        coverTexts: texts,
        coverDynamicLinks: dynamicLinks ?? undefined,
        coverPreviewPositionPercentage,
        coverId: createId(),
        coverIsPredefined: coverIsPredefined || false,
        coverIsLogoPredefined: false,
        updatedAt: new Date(),
      };
      await updateWebCard(webCard.id, updates);
      updatedWebCard = { ...updatedWebCard, ...updates };
    });

    notifyWebCardUsers(webCard, profile.userId);

    await notifyRelatedWalletPasses(webCardId, true);

    if (webCard.userName) {
      invalidateWebCard(webCard.userName);
      const posts = await getWebCardPosts(webCard.id);
      posts.forEach(
        post => webCard.userName && invalidatePost(webCard.userName, post.id),
      );
    }
    return { webCard: updatedWebCard };
  } catch (error) {
    console.log(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default saveCover;
