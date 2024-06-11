import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { inviteUser } from '#use-cases';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { ProfileAlreadyExistsException } from '#use-cases/exceptions/profile-already-exists.exception';
import { InsufficientSubscriptionException } from '#use-cases/exceptions/subscription.exception';
import type { MutationResolvers } from '#__generated__/types';
import type { GraphQLContext } from '#index';

const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { profileId: gqlProfileId, invited, sendInvite },
  { notifyUsers, auth, loaders }: GraphQLContext,
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

  const { email, phoneNumber: rawPhoneNumber } = invited;

  if (email && !isValidEmail(email)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (rawPhoneNumber && !isInternationalPhoneNumber(rawPhoneNumber)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const phoneNumber = rawPhoneNumber
    ? formatPhoneNumber(rawPhoneNumber)
    : undefined;

  if (!email && !phoneNumber) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const contactCard = invited.contactCard
    ? {
        ...invited.contactCard,
        displayedOnWebCard: invited.contactCard.displayedOnWebCard ?? undefined,
        isPrivate: invited.contactCard.isPrivate ?? undefined,
        avatarId: invited.contactCard.avatarId ?? undefined,
        logoId: invited.contactCard.logoId ?? undefined,
      }
    : undefined;

  const profile = await loaders.Profile.load(profileId);

  if (!profile || profile.userId !== auth.userId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const owner = await loaders.webCardOwners.load(profile.webCardId);

  const user = await loaders.User.load(auth.userId);

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!owner || !user || !webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    const profile = await inviteUser({
      invited: {
        profileRole: invited.profileRole,
        contactCard,
        email: invited.email ?? undefined,
        phoneNumber,
      },
      sendInvite: sendInvite ?? false,
      notifyUsers,
      user,
      owner,
      webCard,
    });

    return { profile };
  } catch (e) {
    if (e instanceof ProfileAlreadyExistsException) {
      throw new GraphQLError(ERRORS.PROFILE_ALREADY_EXISTS);
    }

    if (e instanceof InsufficientSubscriptionException) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }

    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default inviteUserMutation;
