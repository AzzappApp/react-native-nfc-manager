import * as Sentry from '@sentry/nextjs';
import { waitUntil } from '@vercel/functions';
import {
  getExpiredSubscription,
  transaction,
  updateSubscription,
} from '@azzapp/data';
import { withPluginsRoute } from '#helpers/queries';
import { unpublishWebCardForUser } from '#helpers/subscription';
import type { NextRequest } from 'next/server';

export const GET = withPluginsRoute((request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // Cancel all pending subscriptions
  waitUntil(unpublishedWebCards());

  return Response.json({ success: true });
});

const unpublishedWebCards = async () => {
  const expiredSubscriptions = await getExpiredSubscription(20);

  const result = await Promise.allSettled(
    expiredSubscriptions.map(async expiredSubscription => {
      await transaction(async () => {
        await unpublishWebCardForUser({
          userId: expiredSubscription.userId,
        });

        await updateSubscription(expiredSubscription.id, {
          invalidatedAt: new Date(),
        });
      });
    }),
  );

  result.forEach(res => {
    if (res.status === 'rejected') {
      console.error(res.reason);
      Sentry.captureException(res.reason);
    }
  });
};
