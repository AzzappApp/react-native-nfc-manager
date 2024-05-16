import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import { createSubscription, updateActiveUserSubscription } from '@azzapp/data';
import cors from '#helpers/cors';

const BEARER_HEADER = 'DkAgYzjiRxns4ty'; //dev value test and release
const subscriptionWebHook = async (req: Request) => {
  const authorization = req.headers.get('Authorization');
  if (!authorization) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (authorization !== `Bearer ${BEARER_HEADER}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const {
    id: rcId,
    app_user_id: userId,
    expiration_at_ms,
    product_id: subscriptionId,
    purchased_at_ms,
    type,
    store,
  } = body;
  // Add a control that env  is PRODUCTION
  //TODO: implement all event(https://www.revenuecat.com/docs/sample-events)
  //https://www.revenuecat.com/docs/event-types-and-fields
  switch (type) {
    case 'INITIAL_PURCHASE':
      await createSubscription({
        userId,
        subscriptionId,
        startAt: new Date(purchased_at_ms),
        endAt: new Date(expiration_at_ms),
        revenueCatId: rcId,
        issuer:
          store === 'APP_STORE'
            ? 'apple'
            : store === 'PLAY_STORE'
              ? 'google'
              : 'web',
        totalSeats: extractSeatsFromSubscriptionId(subscriptionId),
      });
      break;
    case 'CANCELLATION':
    case 'SUBSCRIPTION_EXTENDED':
    case 'UNCANCELLATION':
    case 'EXPIRATION':
      //expiration at a expiration_reason if we need it to know the reason
      await updateActiveUserSubscription(userId, {
        subscriptionId,
        startAt: new Date(purchased_at_ms),
        endAt: new Date(expiration_at_ms),
        revenueCatId: rcId,
        issuer:
          store === 'APP_STORE'
            ? 'apple'
            : store === 'PLAY_STORE'
              ? 'google'
              : 'web',
        totalSeats: extractSeatsFromSubscriptionId(subscriptionId),
      });
      break;
    case 'RENEWAL':
      await updateActiveUserSubscription(userId, {
        userId,
        subscriptionId,
        startAt: new Date(purchased_at_ms),
        endAt: new Date(expiration_at_ms),
        revenueCatId: rcId,
        issuer:
          store === 'APP_STORE'
            ? 'apple'
            : store === 'PLAY_STORE'
              ? 'google'
              : 'web',
        totalSeats: extractSeatsFromSubscriptionId(subscriptionId),
      });
      break;
    case 'BILLING_ISSUE':
      //in case of billing issue, look at the grace period and revoke access if the grace period is over
      await updateActiveUserSubscription(userId, {
        subscriptionId,
        startAt: new Date(purchased_at_ms),
        endAt: new Date(body.grace_period_expiration_at_ms),
        revenueCatId: rcId,
        issuer:
          store === 'APP_STORE'
            ? 'apple'
            : store === 'PLAY_STORE'
              ? 'google'
              : 'web',
        totalSeats: extractSeatsFromSubscriptionId(subscriptionId),
      });
      break;

    case 'PRODUCT_CHANGE':
      //TODO: should we handle it for analytics ?
      //The PRODUCT_CHANGE webhook should be considered informative, and does not mean that the product change has gone into effect. When the product change goes into effect you will receive a RENEWAL event on Apple and Stripe or a INITIAL_PURCHASE event on Google Play.
      break;

    case 'TRANSFER':
      break;
    //case 'SUBSCRIPTION_PAUSED': You should not revoke access when receiving a SUBSCRIPTION_PAUSED event, but only when receiving an EXPIRATION event (which will have the expiration reason SUBSCRIPTION_PAUSED)
    default:
      break;
  }

  return NextResponse.json(null, { status: 200 });
};

export const { POST, OPTIONS } = cors({ POST: withAxiom(subscriptionWebHook) });

export const runtime = 'edge';

function extractSeatsFromSubscriptionId(id: string) {
  const parts = id.split('.');
  const number = parts.pop();
  if (number) {
    return parseInt(number, 10);
  }
  return 0;
}

//event to handle
// Initial purchase
// A new subscription has been purchased or a lapsed user has resubscribed.

// Renewal
// An existing subscription has been renewed.

// Product change
// A customer has changed the product of their subscription.

// Cancellation
// A subscription or non-renewing purchase has been cancelled.

// Billing issue
// There has been a problem trying to charge the subscriber.

// Non renewing purchase
// A customer has made a purchase that will not auto-renew.

// Uncancellation
// A non-expired cancelled subscription has been re-enabled.

// Transfer
// A transfer of transactions and entitlements was initiated between one App User ID(s) to another.

// Subscription paused
// The subscription has set to be paused at the end of the period.

// Expiration
// A subscription has expired.

// Subscription extended
// A subscription has been extended.
