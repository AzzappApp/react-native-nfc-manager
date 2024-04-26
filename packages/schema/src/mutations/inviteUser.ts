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
import { ProfileDoesNotExistException } from '#use-cases/exceptions/profile-does-not-exist.exception';
import type { MutationResolvers } from '#__generated__/types';
import type { GraphQLContext } from '#index';

// @TODO do we verify given profileId belongs to the current user?
const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { profileId: gqlProfileId, invited, sendInvite },
  { sendMail, sendSms }: GraphQLContext,
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

  try {
    const profile = await inviteUser({
      auth: {
        profileId,
      },
      invited: {
        profileRole: invited.profileRole,
        contactCard,
        email: invited.email ?? undefined,
        phoneNumber,
      },
      sendInvite: sendInvite ?? false,
      sendMail,
      sendSms,
    });

    return { profile };
  } catch (e) {
    if (e instanceof ProfileDoesNotExistException) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (e instanceof ProfileAlreadyExistsException) {
      throw new GraphQLError(ERRORS.PROFILE_ALREADY_EXISTS);
    }

    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default inviteUserMutation;
