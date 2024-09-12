import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { updateProfile } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { notifyUsers } from '#externals';
import { profileLoader, userLoader, webCardLoader } from '#loaders';
import { checkWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const transferOwnership: MutationResolvers['transferOwnership'] = async (
  _,
  { webCardId: gqlWebCardId, input: { profileId: gqlProfileId } },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  await checkWebCardOwnerProfile(webCardId);

  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const [targetProfile, webCard] = await Promise.all([
    profileLoader.load(targetProfileId),
    webCardLoader.load(webCardId),
  ]);

  if (!targetProfile || !webCard || targetProfile.webCardId !== webCardId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const targetUser = await userLoader.load(targetProfile.userId);
  if (!targetUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await updateProfile(targetProfileId, { promotedAsOwner: true });

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
