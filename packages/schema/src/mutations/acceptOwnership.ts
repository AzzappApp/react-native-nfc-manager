import * as Sentry from '@sentry/nextjs';
import { eq, and } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const acceptOwnership: MutationResolvers['acceptOwnership'] = async (
  _,
  { profileId: gqlProfileId },
  { auth, loaders, notifyUsers },
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
      await notifyUsers(
        'phone',
        [phoneNumber],
        webCard,
        'transferOwnership',
        guessLocale(user.locale),
      );
    } else if (email) {
      await notifyUsers(
        'email',
        [email],
        webCard,
        'transferOwnership',
        guessLocale(user.locale),
      );
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
