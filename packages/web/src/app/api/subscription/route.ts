import { eq, ne, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import {
  activeUserSubscription,
  createSubscription,
  db,
  unpublisheWebCardForUser,
  updateActiveUserSubscription,
  UserSubscriptionTable,
} from '@azzapp/data';
import cors from '#helpers/cors';

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
    },
  } = body;
  switch (type) {
    case 'INITIAL_PURCHASE': {
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
      break;
    }
    case 'CANCELLATION':
    case 'EXPIRATION':
      db.transaction(async trx => {
        //with the difference bteween azzapp Profile and ios/adnroid account, it can happen that a renewal is done on another profile if the uer created a new profile, initial purchase does not happen
        const sub = await trx
          .select()
          .from(UserSubscriptionTable)
          .where(
            and(
              eq(UserSubscriptionTable.userId, userId),
              ne(UserSubscriptionTable.issuer, 'web'),
            ),
          );
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
            status: 'canceled',
          });
        } else {
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
            status: 'canceled',
          });
          await unpublisheWebCardForUser(userId);
        }
      });

      break;
    case 'SUBSCRIPTION_EXTENDED':
    case 'UNCANCELLATION': //expiration at a expiration_reason if we need it to know the reason
      db.transaction(async trx => {
        //with the difference bteween azzapp Profile and ios/adnroid account, it can happen that a renewal is done on another profile if the uer created a new profile, initial purchase does not happen
        const sub = await trx
          .select()
          .from(UserSubscriptionTable)
          .where(
            and(
              eq(UserSubscriptionTable.userId, userId),
              ne(UserSubscriptionTable.issuer, 'web'),
            ),
          );
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
            status: 'active',
          });
          await unpublisheWebCardForUser(userId);
        }
      });

      //TODO : cancel multi user and unpublish the contact card
      break;
    case 'RENEWAL':
      db.transaction(async trx => {
        //with the difference bteween azzapp Profile and ios/adnroid account, it can happen that a renewal is done on another profile if the uer created a new profile, initial purchase does not happen
        const sub = await trx
          .select()
          .from(UserSubscriptionTable)
          .where(
            and(
              eq(UserSubscriptionTable.userId, userId),
              ne(UserSubscriptionTable.issuer, 'web'),
            ),
          );
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
            freeSeats: 0,
            status: 'active',
          });
        }
      });

      break;
    case 'BILLING_ISSUE':
      //in case of billing issue, look at the grace period and revoke access if the grace period is over
      await updateActiveUserSubscription(userId, {
        subscriptionId,
        startAt: new Date(purchased_at_ms),
        endAt: body.grace_period_expiration_at_ms
          ? new Date(body.grace_period_expiration_at_ms)
          : new Date(body.expiration_at_ms),
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
      break;

    case 'PRODUCT_CHANGE':
      //we need to handle this not only for analytics but also for the number of seat
      db.transaction(async trx => {
        const subs = await activeUserSubscription(userId, trx);
        //I need the subscription from apple or google
        const activeSubscription = subs.find(
          a => a.issuer === 'apple' || a.issuer === 'google',
        );
        if (activeSubscription) {
          await updateActiveUserSubscription(
            userId,
            {
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
            },
            trx,
          );
        }
      });
      break;

    case 'TRANSFER':
      break;
    //TODO: discuss what to do when another azzapp user is logged with the same ios/apple account
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
