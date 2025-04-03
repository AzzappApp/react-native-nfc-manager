import { GraphQLError } from 'graphql';
import {
  checkMedias,
  getWebCardById,
  referencesMedias,
  transaction,
  updateProfile,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import {
  profileHasAdminRight,
  profileIsOwner,
} from '@azzapp/shared/profileHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { profileByWebCardIdAndUserIdLoader, profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

// TODO why do we duplicate the avatarId in the profile and in the contactCard?
// TODO in general perhaps this mutation should be split into two: one for the profile and one for the contactCard
const updateProfileMutation: MutationResolvers['updateProfile'] = async (
  _,
  { profileId: gqlProfileId, input: { profileRole, contactCard } },
) => {
  const { userId } = getSessionInfos();
  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const targetProfile = await profileLoader.load(targetProfileId);

  if (!targetProfile) {
    throw new GraphQLError(ERRORS.PROFILE_DONT_EXISTS);
  }

  const currentProfile =
    userId &&
    (await profileByWebCardIdAndUserIdLoader.load({
      userId,
      webCardId: targetProfile.webCardId,
    }));

  if (!currentProfile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (profileRole === 'owner' && !profileIsOwner(currentProfile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: currentProfile.profileRole,
      },
    });
  }

  if (currentProfile.id !== targetProfileId) {
    if (!profileHasAdminRight(currentProfile.profileRole)) {
      throw new GraphQLError(ERRORS.FORBIDDEN, {
        extensions: {
          role: currentProfile.profileRole,
        },
      });
    }
    if (currentProfile.invited) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
  }

  if (
    currentProfile.id === targetProfileId &&
    profileRole &&
    profileRole !== currentProfile.profileRole
  ) {
    // we don't allow to change profile role of the profile you are logged in
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await getWebCardById(targetProfile.webCardId);

  await validateCurrentSubscription(currentProfile.userId, {
    action: 'UPDATE_CONTACT_CARD',
    webCardIsPublished: !!webCard?.cardIsPublished,
    contactCardHasCompanyName: !!contactCard?.company,
    contactCardHasUrl: !!contactCard?.urls?.length,
    contactCardHasLogo: !!contactCard?.logoId,
  });

  const { avatarId, logoId, ...restContactCard } = contactCard || {};
  try {
    const addedMedia = [avatarId, logoId].filter(
      mediaId => mediaId,
    ) as string[];
    await checkMedias(addedMedia);
    await transaction(async () => {
      await updateProfile(targetProfileId, {
        profileRole: profileRole ?? undefined,
        contactCard: {
          ...restContactCard,
        },
        logoId,
        avatarId,
      });
      await referencesMedias(addedMedia, [
        targetProfile.avatarId,
        targetProfile.logoId,
      ]);
    });
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const updatedProfile = { ...targetProfile };
  if (profileRole) {
    updatedProfile.profileRole = profileRole;
  }
  if (avatarId) {
    updatedProfile.avatarId = avatarId;
  }
  if (logoId) {
    updatedProfile.logoId = logoId;
  }
  if (contactCard) {
    updatedProfile.contactCard = {
      ...contactCard,
    };
  }

  return {
    profile: updatedProfile,
  };
};

export default updateProfileMutation;
