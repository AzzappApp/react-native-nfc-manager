import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { updateWebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCardStyle: MutationResolvers['saveCardStyle'] = async (
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
    cardStyle: input,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
    lastContactCardUpdate: new Date(),
  };
  try {
    await updateWebCard(profile.webCardId, updates);
  } catch (e) {
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

export default saveCardStyle;
