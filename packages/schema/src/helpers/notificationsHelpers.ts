import { sendPushNotification } from '#externals';
import type { User, WebCard } from '@azzapp/data';
import type { IntlShape } from '@formatjs/intl';

export const sendMultiUserInvitationPushNotification = async (
  user: User,
  webCard: WebCard,
  intl: IntlShape,
) => {
  await sendPushNotification(user.id, {
    mediaId: webCard.coverMediaId,
    title: intl.formatMessage({
      defaultMessage: 'Invitation',
      id: 'VTvMCa',
      description: 'Push Notification title for multiuser invitation',
    }),
    body: intl.formatMessage(
      {
        defaultMessage: 'You have been invited to join {userName}',
        id: '8oY4VO',
        description: 'Push Notification body message for multiuser invitation',
      },
      {
        userName: webCard.userName,
      },
    ),
    data: {
      type: 'multiuser_invitation',
    },
  });
};
