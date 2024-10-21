import { GraphQLError } from 'graphql';
import {
  buildDefaultContactCard,
  checkMedias,
  referencesMedias,
  transaction,
  updateProfile,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { ContactCard, MutationResolvers } from '#/__generated__/types';
import type { Profile } from '@azzapp/data';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { profileId: gqlProfileId, contactCard },
) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await profileLoader.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  if (profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const webCard = await webCardLoader.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const contactCardUpdates: Partial<ContactCard> = {
    ...(profile.contactCard ??
      (await buildDefaultContactCard(webCard, userId))),
    ...contactCard,
  };

  const updates: Partial<Profile> = {
    contactCard: {
      ...contactCardUpdates,
      urls: [
        ...(contactCardUpdates.urls?.map(u => ({ ...u, selected: true })) ||
          []),
      ],
      socials: [
        ...(contactCardUpdates.socials?.map(u => ({ ...u, selected: true })) ||
          []),
      ],
    },
  };

  updates.avatarId = contactCard.avatarId;
  updates.logoId = contactCard.logoId;

  try {
    const addedMedia = [contactCard.logoId, contactCard.avatarId].filter(
      mediaId => mediaId,
    ) as string[];
    await checkMedias(addedMedia);
    await transaction(async () => {
      await updateProfile(profileId, updates);
      await referencesMedias(addedMedia, [profile.logoId, profile.avatarId]);
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
