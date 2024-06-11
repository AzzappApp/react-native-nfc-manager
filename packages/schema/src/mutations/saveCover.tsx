import { GraphQLError } from 'graphql';
import {
  checkMedias,
  db,
  getWebCardPosts,
  referencesMedias,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const saveCover: MutationResolvers['saveCover'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: { texts, mediaId, backgroundColor, cardColors, dynamicLinks },
  },
  { cardUsernamesToRevalidate, postsToRevalidate, loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const webCard = await loaders.WebCard.load(webCardId);

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
    await db.transaction(async trx => {
      await referencesMedias(
        [mediaId],
        webCard.coverMediaId ? [webCard.coverMediaId] : null,
        trx,
      );
      const updates: Partial<WebCard> = {
        lastCardUpdate: new Date(),
        coverMediaId: mediaId,
        coverBackgroundColor: backgroundColor,
        cardColors,
        coverTexts: texts,
        coverDynamicLinks: dynamicLinks,
      };
      await updateWebCard(webCard.id, updates, trx);
      updatedWebCard = { ...updatedWebCard, ...updates };
    });

    cardUsernamesToRevalidate.add(webCard.userName);
    const posts = await getWebCardPosts(webCard.id);
    posts.forEach(post =>
      postsToRevalidate.add({ id: post.id, userName: webCard.userName }),
    );

    return { webCard: updatedWebCard };
  } catch (error) {
    console.log(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default saveCover;
