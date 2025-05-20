import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import {
  createSubscription,
  getIAPSubscriptions,
  getTotalMultiUser,
  getWebCardByUserId,
  transaction,
  updateActiveInAppUserSubscription,
} from '@azzapp/data';

import { revalidateWebcardsAndPosts } from '#helpers/api';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';
import {
  unpublishWebCardForNoSeat,
  unpublishWebCardForUser,
} from '#helpers/subscription';

const BEARER_HEADER = process.env.IAP_REVENUECAT_NOTIFICATION_BEARER;
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
    event: {
      app_user_id: userId,
      expiration_at_ms,
      product_id: subscriptionId,
      purchased_at_ms,
      id: rcId,
      type,
      store,
      grace_period_expiration_at_ms,
    },
  } = body;
  try {
    switch (type) {
      case 'INITIAL_PURCHASE': {
        await transaction(async () => {
          const totalSeats = extractSeatsFromSubscriptionId(subscriptionId);
          const sub = await getIAPSubscriptions(userId);
          const totalUsedSeats = await getTotalMultiUser(userId);
          if (sub.length === 0) {
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
              totalSeats,
              freeSeats: totalSeats - totalUsedSeats,
              status: 'active',
            });
          } else {
            await updateActiveInAppUserSubscription(sub[0].id, {
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
              totalSeats,
              freeSeats: totalSeats - totalUsedSeats,
              status: 'active',
            });
          }
          //android is messy, changing product is consiered a a INITIAL_PURCHASE
          if (totalSeats - totalUsedSeats < 0) {
            await unpublishWebCardForNoSeat({
              userId,
            });
          }
        });
        break;
      }
      case 'CANCELLATION':
        // Use it for analytics. The flow will always return a expiration event at the end of the subscription
        break;
      case 'EXPIRATION':
        await transaction(async () => {
          const sub = await getIAPSubscriptions(userId);

          if (sub.length === 0) {
            await createSubscription({
              userId,
              subscriptionId,
              startAt: new Date(expiration_at_ms),
              endAt: new Date(expiration_at_ms),
              revenueCatId: rcId,
              issuer:
                store === 'APP_STORE'
                  ? 'apple'
                  : store === 'PLAY_STORE'
                    ? 'google'
                    : 'web',
              totalSeats: extractSeatsFromSubscriptionId(subscriptionId),
              freeSeats: 0,
              status: 'canceled',
              invalidatedAt: new Date(),
            });
          } else {
            await updateActiveInAppUserSubscription(sub[0].id, {
              subscriptionId,
              startAt: new Date(expiration_at_ms),
              endAt: new Date(expiration_at_ms),
              revenueCatId: rcId,
              status: 'canceled',
              invalidatedAt: new Date(),
              totalSeats: extractSeatsFromSubscriptionId(subscriptionId),
            });

            await unpublishWebCardForUser({ userId });
          }
        });

        break;
      case 'SUBSCRIPTION_EXTENDED':
      case 'UNCANCELLATION':
        await transaction(async () => {
          const sub = await getIAPSubscriptions(userId);
          if (sub.length === 0) {
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
              freeSeats: 0,
              status: 'active',
            });
          } else {
            await updateActiveInAppUserSubscription(sub[0].id, {
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
              status: 'active',
            });
          }
        });
        break;
      case 'RENEWAL':
        await transaction(async () => {
          const totalSeats = extractSeatsFromSubscriptionId(subscriptionId);
          const totalUsedSeats = await getTotalMultiUser(userId);
          const sub = await getIAPSubscriptions(userId);
          if (sub.length === 0) {
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
              totalSeats,
              freeSeats: totalSeats - totalUsedSeats,
              status: 'active',
            });
          } else {
            await updateActiveInAppUserSubscription(sub[0].id, {
              startAt: new Date(purchased_at_ms),
              endAt: new Date(expiration_at_ms),
              revenueCatId: rcId,
              subscriptionId,
              issuer:
                store === 'APP_STORE'
                  ? 'apple'
                  : store === 'PLAY_STORE'
                    ? 'google'
                    : 'web',
              totalSeats,
              freeSeats: totalSeats - totalUsedSeats,
              status: 'active',
            });

            if (totalSeats - totalUsedSeats < 0) {
              await unpublishWebCardForNoSeat({
                userId,
              });
            }
          }
        });

        break;
      case 'BILLING_ISSUE':
        //in case of billing issue, look at the grace period for add extended time
        //in any case,  a cancellation and expiration event will be sent after grace period
        if (
          grace_period_expiration_at_ms &&
          new Date(grace_period_expiration_at_ms) > new Date()
        ) {
          await transaction(async () => {
            const sub = await getIAPSubscriptions(userId);
            if (sub.length === 0) {
              await createSubscription({
                userId,
                subscriptionId,
                startAt: new Date(purchased_at_ms),
                endAt: new Date(grace_period_expiration_at_ms),
                revenueCatId: rcId,
                issuer:
                  store === 'APP_STORE'
                    ? 'apple'
                    : store === 'PLAY_STORE'
                      ? 'google'
                      : 'web',
                freeSeats: 0,
                status: 'active',
              });
            } else {
              await updateActiveInAppUserSubscription(sub[0].id, {
                endAt: new Date(grace_period_expiration_at_ms),
                revenueCatId: rcId,
                subscriptionId,
                freeSeats: 0,
                status: 'active',
              });
            }
          });
        }
        break;

      case 'PRODUCT_CHANGE':
        // PRODUCT CHANGE WAS BREAKING THE SUBSCRIPTION
        // The PRODUCT_CHANGE webhook should be considered informative,
        // and does not mean that the product change has gone into effect. When the product change goes into effect
        // you will receive a RENEWAL event on Apple and Stripe or a INITIAL_PURCHASE event on Google Play.
        //we can use it for analytics
        break;
      case 'TRANSFER':
        break;
      //we are transfering only when the user sub is over, no work is required here
    }

    const webcards = await getWebCardByUserId(userId);
    revalidateWebcardsAndPosts(
      webcards
        .map(({ userName }) => userName)
        .filter(userName => userName !== null),
    );

    return NextResponse.json(null, { status: 200 });
  } catch (e) {
    console.error(e);
    Sentry.captureException(e);
    return NextResponse.json(null, { status: 500 });
  }
};

export const { POST, OPTIONS } = cors({
  POST: withPluginsRoute(subscriptionWebHook),
});

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

//   {event: {
//      event_timestamp_ms: 1720528317767,
//      product_id: 'com.azzap.dev.monthly.1',
//      period_type: 'NORMAL',
//      purchased_at_ms: 1720527997000,
//      expiration_at_ms: 1720528297000,
//      environment: 'SANDBOX',
//      entitlement_id: null,
//      entitlement_ids: ['multiuser'],
//      presented_offering_id: 'com.azzapp.multiuser',
//      transaction_id: '2000000651473165',
//      original_transaction_id: '2000000650231595',
//      is_family_share: false,
//      country_code: 'FR',
//      app_user_id: 'dqwiewcdewkv',
//      aliases: ['dqwiewcdewkv'],
//      original_app_user_id: 'dqwiewcdewkv',
//      grace_period_expiration_at_ms: null,
//      currency: 'EUR',
//      price: 0,
//      price_in_purchased_currency: 0,
//      subscriber_attributes: {
//        $email: { value: 's5@g.com', updated_at_ms: 1720435833505 },
//        $attConsentStatus: {
//          value: 'denied',
//          updated_at_ms: 1720435913492,
//        },
//      },
//      store: 'APP_STORE',
//      takehome_percentage: 0.85,
//      offer_code: null,
//      tax_percentage: 0.1757,
//      commission_percentage: 0.1237,
//      type: 'BILLING_ISSUE',
//      id: '606A69A4-4F61-4C5D-9FEB-32787330D2D8',
//      app_id: 'app0ba766d30f',
//    },
//    api_version: '1.0',
//  };

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
