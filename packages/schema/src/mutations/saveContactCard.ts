import { GraphQLError } from 'graphql';
import {
  buildDefaultContactCard,
  checkMedias,
  db,
  referencesMedias,
  updateProfile,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { Profile } from '@azzapp/data';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { profileId: gqlProfileId, contactCard },
  { auth, loaders },
) => {
  const { userId } = auth;
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates: Partial<Profile> = {
    contactCard: {
      ...(profile.contactCard ??
        (await buildDefaultContactCard(webCard, userId))),
      ...contactCard,
    },
  };

  updates.avatarId = contactCard.avatarId;
  updates.logoId = contactCard.logoId;

  try {
    const addedMedia = [contactCard.logoId, contactCard.avatarId].filter(
      mediaId => mediaId,
    ) as string[];
    await checkMedias(addedMedia);
    await db.transaction(async trx => {
      await updateProfile(profileId, updates, trx);

      await referencesMedias(
        addedMedia,
        [profile.logoId, profile.avatarId],
        trx,
      );
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    profile: {
      ...profile,
      ...updates,
    },
  };
};

export default saveContactCard;
