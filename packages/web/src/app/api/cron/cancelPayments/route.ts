import { waitUntil } from '@vercel/functions';
import { cancelExpiredSubscription } from '@azzapp/data';
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // Cancel all pending subscriptions
  waitUntil(cancelExpiredSubscription());

  return Response.json({ success: true });
}
