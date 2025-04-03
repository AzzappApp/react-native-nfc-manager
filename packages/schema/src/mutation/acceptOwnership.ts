import { captureException } from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  getWebCardCountProfile,
  transaction,
  updateProfile,
  updateProfileForUserAndWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import {
  profileLoader,
  userLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import {
  updateMonthlySubscription,
  validateCurrentSubscription,
} from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const acceptOwnership: MutationResolvers['acceptOwnership'] = async (
  _,
  { profileId: gqlProfileId },
) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalId(gqlProfileId).id;

  const [profile, user] = await Promise.all([
    profileLoader.load(profileId),
    userLoader.load(userId),
  ]);

  if (!profile || profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (!user || !profile?.promotedAsOwner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await webCardLoader.load(profile.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const owner = await webCardOwnerLoader.load(webCard.id);

  const webCardNbSeats = await getWebCardCountProfile(profile.webCardId);

  await validateCurrentSubscription(user.id, {
    webCardIsPublished: webCard.cardIsPublished,
    action: 'UPDATE_MULTI_USER',
    addedSeats: webCardNbSeats,
  });

  try {
    const updatedProfile = await transaction(async () => {
      if (owner) {
        await updateProfileForUserAndWebCard(owner.id, profile.webCardId, {
          profileRole: 'admin',
        });
        await updateMonthlySubscription(owner.id);
      }
      await updateProfile(profileId, {
        profileRole: 'owner',
        promotedAsOwner: false,
        invited: false,
      });

      return {
        ...profile,
        profileRole: 'owner',
        promotedAsOwner: false,
        invited: false,
      } as const;
    });

    profileLoader.prime(profileId, updatedProfile);

    return {
      profile: updatedProfile,
    };
  } catch (error) {
    captureException(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default acceptOwnership;
