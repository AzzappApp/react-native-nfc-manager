import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import { getUsersFromWebCard, updateWebCardProfiles } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

// to avoid sending too many invitations by SMS
const MAX_INVITATIONS_BY_SMS = 20;

const sendInvitations: MutationResolvers['sendInvitations'] = async (
  _,
  { webCardId: gqlWebCardId, profileIds, allProfiles },
  { notifyUsers, loaders, auth },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  if (!profileIds?.length && !allProfiles) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const users = await getUsersFromWebCard(
    webCardId,
    allProfiles
      ? undefined
      : profileIds?.map(id => fromGlobalIdWithType(id, 'Profile')),
  );

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!auth.userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const user = await loaders.User.load(auth.userId);

  const { withEmail, withPhoneNumbers } = users.reduce<{
    withEmail: typeof users;
    withPhoneNumbers: typeof users;
  }>(
    (acc, { user, profileId }) => {
      if (user.email) {
        acc.withEmail.push({ user, profileId });
      } else if (user.phoneNumber) {
        acc.withPhoneNumbers.push({ user, profileId });
      }
      return acc;
    },
    { withEmail: [], withPhoneNumbers: [] },
  );

  if (withPhoneNumbers.length > MAX_INVITATIONS_BY_SMS) {
    throw new GraphQLError(ERRORS.PAYLOAD_TOO_LARGE);
  }

  try {
    if (withPhoneNumbers.length > 0 || withEmail.length > 0) {
      await updateWebCardProfiles(
        webCardId,
        { inviteSent: true },
        withPhoneNumbers
          .map(({ profileId }) => profileId)
          .concat(withEmail.map(({ profileId }) => profileId)),
      );
    }

    if (withEmail.length > 0) {
      await notifyUsers(
        'email',
        withEmail.map(({ user: { email } }) => email!),
        webCard,
        'invitation',
        guessLocale(user?.locale),
      );
    }

    if (withPhoneNumbers.length > 0) {
      await notifyUsers(
        'phone',
        withPhoneNumbers.map(({ user: { phoneNumber } }) => phoneNumber!),
        webCard,
        'invitation',
        guessLocale(user?.locale),
      );
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return users.map(({ profileId }) => toGlobalId('Profile', profileId));
};

export default sendInvitations;
