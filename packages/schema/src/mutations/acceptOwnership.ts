import * as Sentry from '@sentry/nextjs';
import { eq, and } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const acceptOwnership: MutationResolvers['acceptOwnership'] = async (
  _,
  { profileId: gqlProfileId },
  { auth, loaders, sendMail, sendSms },
) => {
  const { userId } = auth;
  const profileId = fromGlobalId(gqlProfileId).id;

  const [profile, user] = await Promise.all([
    loaders.Profile.load(profileId),
    userId && loaders.User.load(userId),
  ]);

  if (!user || !profile?.promotedAsOwner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await db.transaction(async trx => {
    await trx
      .update(ProfileTable)
      .set({ profileRole: 'admin' })
      .where(
        and(
          eq(ProfileTable.webCardId, profile.webCardId),
          eq(ProfileTable.profileRole, 'owner'),
        ),
      );

    await trx
      .update(ProfileTable)
      .set({ profileRole: 'owner', promotedAsOwner: false, invited: false })
      .where(eq(ProfileTable.id, profileId));
  });

  const { email, phoneNumber } = user;
  try {
    if (phoneNumber) {
      await sendSms({
        body: `Dear user, you are invited to take over the ownership of ${webCard.userName}. You can accept or decline the invitation from the app home page.`,
        phoneNumber,
      });
    } else if (email) {
      await sendMail([
        {
          email,
          subject: `WebCard ownership transfer invitation.`,
          text: `Dear user, you are invited to take over the ownership of ${webCard.userName}. You can accept or decline the invitation from the app home page.`,
          html: `<div>Dear user, you are invited to take over the ownership of ${webCard.userName}. You can accept or decline the invitation from the app home page.</div>`,
        },
      ]);
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    profile: {
      ...profile,
      profileRole: 'owner',
      promotedAsOwner: false,
      invited: false,
    },
  };
};

export default acceptOwnership;
