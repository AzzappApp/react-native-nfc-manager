import { waitUntil } from '@vercel/functions';
import { cancelExpiredSubscription } from '@azzapp/data';
import env from '#env';
import { withPluginsRoute } from '#helpers/queries';
import type { NextRequest } from 'next/server';

export const GET = withPluginsRoute((request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // Cancel all pending subscriptions
  waitUntil(cancelExpiredSubscription());

  return Response.json({ success: true });
});
