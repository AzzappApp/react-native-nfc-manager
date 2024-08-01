import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { ProfileTable, db } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const transferOwnership: MutationResolvers['transferOwnership'] = async (
  _,
  { webCardId: gqlWebCardId, input: { profileId: gqlProfileId } },
  { loaders, notifyUsers },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const [targetProfile, webCard] = await Promise.all([
    loaders.Profile.load(targetProfileId),
    loaders.WebCard.load(webCardId),
  ]);

  if (!targetProfile || !webCard || targetProfile.webCardId !== webCardId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const targetUser = await loaders.User.load(targetProfile.userId);
  if (!targetUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await db
    .update(ProfileTable)
    .set({ promotedAsOwner: true })
    .where(eq(ProfileTable.id, targetProfileId));

  try {
    const { phoneNumber, email } = targetUser;
    if (email) {
      await notifyUsers(
        'email',
        [email],
        webCard,
        'transferOwnership',
        guessLocale(targetUser.locale),
      );
    } else if (phoneNumber) {
      await notifyUsers(
        'phone',
        [phoneNumber],
        webCard,
        'transferOwnership',
        guessLocale(targetUser.locale),
      );
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    profile: {
      ...targetProfile,
      promotedAsOwner: true,
    },
  };
};

export default transferOwnership;
