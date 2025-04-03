import { toGlobalId } from 'graphql-relay';
import { getUsersToNotifyOnWebCard } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import { sendPushNotification } from '#helpers/notificationsHelpers';
import { inngest } from '../client';

const NOTIF_DELAY = process.env.WEBCARD_NOTIFICATION_DELAY || '5m';

export const notifyWebCardUsersBatch = inngest.createFunction(
  {
    id: 'webCardUsersNotificationBatch',
    cancelOn: [
      {
        event: 'batch/webCardUsersNotification',
        match: 'data.webCard.id',
      },
    ],
  },
  { event: 'batch/webCardUsersNotification' },
  async ({ event, step }) => {
    const webCard = event.data.webCard;

    if (!webCard) {
      return { queued: 0 };
    }

    await step.sleep('wait-debounce', NOTIF_DELAY);

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
