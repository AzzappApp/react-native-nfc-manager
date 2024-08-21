import { GraphQLError } from 'graphql';
import {
  updateWebCardProfiles,
  updateWebCard,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

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
    await transaction(async () => {
      await updateWebCard(webCardId, updates);
      await updateWebCardProfiles(
        webCardId,
        { lastContactCardUpdate: new Date() },
        undefined,
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
