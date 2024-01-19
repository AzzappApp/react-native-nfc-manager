import * as Sentry from '@sentry/nextjs';
import { and, eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
} from '@azzapp/shared/stringHelpers';
import { UserTable, createProfile, createUser, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { GraphQLContext } from '#index';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { SQLWrapper } from 'drizzle-orm';

const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { input },
  { auth, loaders, sendMail, sendSms }: GraphQLContext,
) => {
  const { userId } = auth;
  const { email, phoneNumber: rawPhoneNumber, profileId: gqlProfileId } = input;

  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = profileId && (await loaders.Profile.load(profileId));
  if (!profile || !isAdmin(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (rawPhoneNumber && !isInternationalPhoneNumber(rawPhoneNumber)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const phoneNumber = rawPhoneNumber ? formatPhoneNumber(rawPhoneNumber) : '';

  if (!email && !phoneNumber) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const filters: SQLWrapper[] = [];

  if (email) filters.push(eq(UserTable.email, email));
  if (phoneNumber) filters.push(eq(UserTable.phoneNumber, phoneNumber));

  const existingUser = await db
    .select()
    .from(UserTable)
    .where(and(...filters))
    .then(res => res.pop());

  const webCard = await loaders.WebCard.load(profile.webCardId);
  if (!webCard || !webCard.isMultiUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const createdProfileId = await db.transaction(async trx => {
    let userId;
    if (!existingUser) {
      userId = await createUser(
        {
          email,
          phoneNumber,
          invited: true,
        },
        trx,
      );
    } else {
      userId = existingUser.id;
    }

    const { displayedOnWebCard, isPrivate, avatarId, ...data } =
      input.contactCard ?? {};

    const payload = {
      webCardId: profile.webCardId,
      userId,
      avatarId,
      invited: true,
      contactCard: {
        ...data,
        birthday: undefined,
      },
      contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
      contactCardIsPrivate: displayedOnWebCard ?? false,
      profileRole: input.profileRole,
      lastContactCardUpdate: new Date(),
      nbContactCardScans: 0,
      promotedAsOwner: false,
    };

    try {
      const profileId = await createProfile(payload, trx);
      return profileId;
    } catch (e) {
      throw new GraphQLError(ERRORS.PROFILE_ALREADY_EXISTS);
    }
  });

  if (!createdProfileId) throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);

  const createdProfile = await loaders.Profile.load(createdProfileId);

  try {
    if (phoneNumber) {
      await sendSms({
        body: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this phone number to join: ${phoneNumber}`,
        phoneNumber,
      });
    } else if (email) {
      await sendMail({
        email,
        subject: `You have been invited to join ${webCard.userName}`,
        text: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}`,
        html: `<div>You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}</div>`,
      });
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    profile: createdProfile,
  };
};

export default inviteUserMutation;
