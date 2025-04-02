import { toGlobalId } from 'graphql-relay';
import { getUsersToNotifyOnWebCard } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import { sendPushNotification } from '#helpers/notificationsHelpers';
import { inngest } from '../client';

const NOTIF_DELAY = process.env.WEBCARD_NOTIFICATION_DELAY
  ? parseInt(process.env.WEBCARD_NOTIFICATION_DELAY, 10)
  : 5;

export const notifyWebCardUsersBatch = inngest.createFunction(
  { id: 'webCardUsersNotificationBatch' },
  { event: 'batch/webCardUsersNotification' },
  async ({ event, step }) => {
    const webCard = event.data.webCard;
    const previousUpdatedAt = event.data.previousUpdatedAt;
    if (webCard) {
      const diffInMs =
        new Date().getTime() - new Date(previousUpdatedAt).getTime();
      const diffInMinutes = diffInMs / 1000 / 60;

      if (diffInMinutes >= NOTIF_DELAY) {
        const users = await getUsersToNotifyOnWebCard(webCard.id);
        for (const user of users) {
          await step.sendEvent(`send-webCardUpdate-${webCard.id}-${user.id}`, {
            name: 'send/webCardUsersNotification',
            data: {
              user,
              webCard,
            },
          });
        }

        return { queued: users.length };
      }
    }

    return { queued: 0 };
  },
);

export const notifyWebCardUser = inngest.createFunction(
  { id: 'webCardUsersNotification' },
  { event: 'send/webCardUsersNotification' },
  async ({ event }) => {
    const { user, webCard } = event.data;
    await sendPushNotification(user.id, {
      notification: {
        type: 'webCardUpdate',
        webCardId: toGlobalId('WebCard', webCard.id),
      },
      mediaId: null,
      sound: 'default',
      locale: guessLocale(user.locale),
      localeParams: {
        webCardUserName: webCard.userName ?? '',
      },
    });

    return { sent: true };
  },
);
