import * as Sentry from '@sentry/nextjs';
import { and, eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { UserTable, createProfile, createUser, db } from '#domains';
import type { GraphQLContext } from '#index';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { SQLWrapper } from 'drizzle-orm';

const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { input },
  { auth, loaders, sendMail, sendSms }: GraphQLContext,
) => {
  const { profileId } = auth;
  const { email, phoneNumber } = input;

  if (!profileId) throw new GraphQLError(ERRORS.UNAUTHORIZED);
  if (!email && !phoneNumber) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const filters: SQLWrapper[] = [];

  if (email) filters.push(eq(UserTable.email, email));
  if (phoneNumber) filters.push(eq(UserTable.phoneNumber, phoneNumber));

  const existingUser = await db
    .select()
    .from(UserTable)
    .where(and(...filters))
    .then(res => res.pop());

  const profile = await loaders.Profile.load(profileId);

  //check if the authed profile as the right to invite someone(multi user on)
  const webCard = profile
    ? await loaders.WebCard.load(profile.webCardId)
    : null;

  if (
    !profile ||
    !webCard ||
    !webCard.isMultiUser ||
    !isAdmin(profile.profileRole)
  ) {
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
        birthday: data.birthday ?? undefined,
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
