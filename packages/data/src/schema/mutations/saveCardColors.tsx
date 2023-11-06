import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { db, updateProfile, updateWebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCardColors: MutationResolvers['saveCardColors'] = async (
  _,
  { input },
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profile = await loaders.Profile.load(profileId);
  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates = {
    cardColors: input,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };
  try {
    await db.transaction(async trx => {
      await updateWebCard(profile.webCardId, updates, trx);
      await updateProfile(
        profileId,
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
