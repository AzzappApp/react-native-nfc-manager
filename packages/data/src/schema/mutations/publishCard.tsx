import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { updateWebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const publishCard: MutationResolvers['publishCard'] = async (
  _,
  _args,
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isAdmin(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates = {
    cardIsPublished: true,
    alreadyPublished: true,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };

  try {
    await updateWebCard(profile.webCardId, updates);
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

const unpublishCard: MutationResolvers['unpublishCard'] = async (
  _,
  _args,
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const profileId = auth.profileId;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isAdmin(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates = {
    cardIsPublished: false,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
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

export { publishCard, unpublishCard };
