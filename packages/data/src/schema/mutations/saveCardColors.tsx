import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { db, updateProfiles, updateWebCard } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCardColors: MutationResolvers['saveCardColors'] = async (
  _,
  { webCardId: gqlWebCardId, input: cardColors },
  { cardUsernamesToRevalidate, loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const updates = {
    cardColors,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };
  try {
    await db.transaction(async trx => {
      await updateWebCard(webCardId, updates, trx);
      await updateProfiles(
        webCardId,
        { lastContactCardUpdate: new Date() },
        trx,
      );
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  cardUsernamesToRevalidate.add(webCard.userName);
  return {
    webCard: {
      ...webCard,
      ...updates,
    },
  };
};

export default saveCardColors;
