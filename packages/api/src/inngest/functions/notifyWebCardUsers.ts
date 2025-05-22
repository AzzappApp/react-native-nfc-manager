import { toGlobalId } from 'graphql-relay';
import { getUsersToNotifyOnWebCard } from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import { createServerIntl } from '@azzapp/service/i18nServices';
import { sendPushNotification } from '@azzapp/service/notificationsHelpers';
import env from '#env';
import { inngest } from '../client';
import type { WebCard } from '@azzapp/data';

const NOTIF_DELAY = env.WEBCARD_NOTIFICATION_DELAY;

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
    const webCard: WebCard = event.data.webCard;
    const editorUserId: string = event.data.editorUserId;

    if (!webCard) {
      return { queued: 0 };
    }

    await step.sleep('wait-debounce', NOTIF_DELAY);

    const users = await getUsersToNotifyOnWebCard(webCard.id, editorUserId);

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
    const intl = createServerIntl(guessLocale(user.locale));
    await sendPushNotification(user.id, {
      sound: 'default',
      mediaId: webCard.coverMediaId,
      data: {
        webCardId: toGlobalId('WebCard', webCard.id),
        type: 'webCardUpdate',
      },
      title: intl.formatMessage(
        {
          defaultMessage: 'WebCard {webCardUserName} Update',
          id: 'Klvd4Y',
          description: 'Push Notification title for webcard update',
        },
        {
          webCardUserName: webCard.userName,
        },
      ) as string,
      body: intl.formatMessage(
        {
          defaultMessage:
            'The WebCard {webCardUserName} has been updated. Click to view it.',
          id: 'tE1mwA',
          description: 'Push Notification body message for webcard update',
        },
        {
          webCardUserName: webCard.userName,
        },
      ) as string,
    });

    return { sent: true };
  },
);
