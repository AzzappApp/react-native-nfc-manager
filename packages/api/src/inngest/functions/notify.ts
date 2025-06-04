import { sendPushNotification as send } from '@azzapp/service/notificationsHelpers';
import { inngest } from '#inngest/client';

export const sendPushNotification = inngest.createFunction(
  { id: 'pushNotification' },
  { event: 'send/pushNotification' },
  async ({ event }) => {
    const { userId, message } = event.data;

    await send(userId, message);

    return { sent: true };
  },
);
