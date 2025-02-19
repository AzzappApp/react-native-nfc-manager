import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import { getUsersFromWebCard, updateWebCardProfiles } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { notifyUsers, sendPushNotification } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { userLoader, webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

// to avoid sending too many invitations by SMS
const MAX_INVITATIONS_BY_SMS = 20;

const sendInvitations: MutationResolvers['sendInvitations'] = async (
  _,
  { webCardId: gqlWebCardId, profileIds, allProfiles },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  await checkWebCardProfileAdminRight(webCardId);

  if (!profileIds?.length && !allProfiles) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const users = await getUsersFromWebCard(
    webCardId,
    allProfiles
      ? undefined
      : profileIds?.map(id => fromGlobalIdWithType(id, 'Profile')),
  );

  const countDeletedProfiles = users.filter(
    ({ profileIsDeleted }) => profileIsDeleted,
  ).length;

  if (countDeletedProfiles > 0) {
    await validateCurrentSubscription(
      getSessionInfos().userId!,
      countDeletedProfiles,
    );
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const user = await userLoader.load(userId);

  const { withEmail, withPhoneNumbers } = users.reduce<{
    withEmail: typeof users;
    withPhoneNumbers: typeof users;
  }>(
    (acc, value) => {
      if (value.user.email) {
        acc.withEmail.push(value);
      } else if (value.user.phoneNumber) {
        acc.withPhoneNumbers.push(value);
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
      const deletedProfiles = withPhoneNumbers
        .filter(({ profileIsDeleted }) => profileIsDeleted)
        .map(({ profileId }) => profileId)
        .concat(
          withEmail
            .filter(({ profileIsDeleted }) => profileIsDeleted)
            .map(({ profileId }) => profileId),
        );
      if (deletedProfiles.length > 0) {
        await updateWebCardProfiles(
          webCardId,
          {
            inviteSent: true,
            invited: true,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
          },
          deletedProfiles,
        );
      }

      const activeUsers = withPhoneNumbers
        .filter(({ user }) => !user.deleted)
        .map(({ profileId }) => profileId)
        .concat(
          withEmail
            .filter(({ user }) => !user.deleted)
            .map(({ profileId }) => profileId),
        );
      if (activeUsers.length > 0) {
        await updateWebCardProfiles(
          webCardId,
          {
            inviteSent: true,
          },
          activeUsers,
        );
      }
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
    for (let i = 0; i < users.length; i++) {
      const userToNotify = users[i].user;
      if (userToNotify && webCard.userName) {
        await sendPushNotification(userToNotify.id, {
          type: 'multiuser_invitation',
          mediaId: webCard.coverMediaId,
          deepLink: 'multiuser_invitation',
          localeParams: { userName: webCard.userName },
          locale: guessLocale(userToNotify.locale),
        });
      }
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return users.map(({ profileId }) => toGlobalId('Profile', profileId));
};

export default sendInvitations;
