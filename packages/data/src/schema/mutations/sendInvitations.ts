import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { getUsersFromWebCardId, updateProfiles } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

// to avoid sending too many invitations by SMS
const MAX_INVITATIONS_BY_SMS = 20;

const sendInvitations: MutationResolvers['sendInvitations'] = async (
  _,
  { webCardId: gqlWebCardId, profileIds, allProfiles },
  { sendMail, sendSms, loaders, auth },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  if (!profileIds && !allProfiles) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const users = await getUsersFromWebCardId(
    webCardId,
    profileIds?.map(id => fromGlobalIdWithType(id, 'Profile')),
  );

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { withEmail, withPhoneNumbers } = users.reduce<{
    withEmail: typeof users;
    withPhoneNumbers: typeof users;
  }>(
    (acc, user) => {
      if (user.id !== auth.userId) {
        if (user.email) {
          acc.withEmail.push(user);
        } else if (user.phoneNumber) {
          acc.withPhoneNumbers.push(user);
        }
      }
      return acc;
    },
    { withEmail: [], withPhoneNumbers: [] },
  );

  if (withPhoneNumbers.length > MAX_INVITATIONS_BY_SMS) {
    throw new GraphQLError(ERRORS.PAYLOAD_TOO_LARGE);
  }

  try {
    if (users.length > 0) {
      await updateProfiles(
        webCardId,
        { inviteSent: true },
        withPhoneNumbers
          .map(({ profileId }) => profileId)
          .concat(withEmail.map(({ profileId }) => profileId)),
      );
    }

    if (withEmail.length > 0) {
      await sendMail(
        withEmail.map(({ email }) => ({
          email: email!,
          subject: `You have been invited to join ${webCard.userName}`,
          text: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}`,
          html: `<div>You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}</div>`,
        })),
      );
    }

    if (withPhoneNumbers.length > 0) {
      await Promise.allSettled(
        withPhoneNumbers.map(({ phoneNumber }) =>
          sendSms({
            phoneNumber: phoneNumber!,
            body: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this phone number to join: ${phoneNumber}`,
          }),
        ),
      );
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return users.map(({ profileId }) => profileId);
};

export default sendInvitations;
