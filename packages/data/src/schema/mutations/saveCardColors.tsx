import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  db,
  getUserProfileWithWebCardId,
  updateProfile,
  updateWebCard,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCardColors: MutationResolvers['saveCardColors'] = async (
  _,
  { input: { webCardId: gqlWebCardId, ...cardColors } },
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const updates = {
    cardColors,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };
  try {
    await db.transaction(async trx => {
      await updateWebCard(profile.webCardId, updates, trx);
      await updateProfile(
        profile.id,
        { lastContactCardUpdate: new Date() },
        trx,
      );
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

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
