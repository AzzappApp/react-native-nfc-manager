import { NextResponse } from 'next/server';
import { activeUserSubscription } from '@azzapp/data';
import { getSessionData } from '#helpers/tokens';

/**
 * Return the active subscription for the current user
 * Doing this API fetch method because I can't use a simple request (based on authState Event) in a context using relay (without laodingquery then preloading query the using fragment)
 * or doing it will add some complexity to the code. in this case, using api is FAR more simple
 *
 * @return {*}
 */
const getActiveSubscription = async () => {
  const { userId } = (await getSessionData()) ?? {};
  if (!userId) {
    return new Response('Invalid request', { status: 400 });
  }

  const subscription = await activeUserSubscription(userId);
  if (!subscription || subscription.length === 0) {
    return NextResponse.json({ subscription: undefined }, { status: 200 });
  } else {
    return NextResponse.json(
      { subscription: subscription[0] },
      { status: 200 },
    );
  }
};

export const { GET } = { GET: getActiveSubscription };

export const runtime = 'edge';
