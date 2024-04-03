import { GraphQLError } from 'graphql';
import { updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const saveCardStyle: MutationResolvers['saveCardStyle'] = async (
  _,
  { webCardId: gqlWebCardId, input: cardStyle },
  { cardUsernamesToRevalidate, loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const updates = {
    cardStyle,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };
  try {
    await updateWebCard(webCardId, updates);
  } catch (e) {
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

export default saveCardStyle;
