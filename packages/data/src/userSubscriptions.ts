import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  gte,
  or,
} from 'drizzle-orm';
import {
  text,
  mysqlTable,
  mysqlEnum,
  int,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const UserSubscriptionTable = mysqlTable(
  'UserSubscription',
  {
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.cuid('webCardId').notNull().default(''),
    subscriptionId: text('subscriptionId').notNull(),
    subscriptionPlan: cols.enum('subscriptionPlan', [
      'web.monthly',
      'web.yearly',
      'web.lifetime',
    ]),
    totalSeats: int('totalSeats').default(0).notNull(),
    revenueCatId: text('revenueCatId'),
    issuer: mysqlEnum('issuer', ['apple', 'google', 'web']).notNull(), //web should be user over revenue cat
    startAt: cols.dateTime('startAt').notNull(),
    endAt: cols.dateTime('endAt').notNull(),
    subscriberEmail: cols.defaultVarchar('subscriberEmail'),
    subscriberPhoneNumber: cols.defaultVarchar('subscriberPhoneNumber'),
    subscriberName: cols.defaultVarchar('subscriberName'),
    subscriberAddress: cols
      .defaultVarchar('subscriberAddress')
      .notNull()
      .default(''),
    subscriberVatNumber: cols.defaultVarchar('subscriberVatNumber'),
    subscriberZip: cols.defaultVarchar('subscriberZip'),
    subscriberCity: cols.defaultVarchar('subscriberCity'),
    subscriberCountry: cols.defaultVarchar('subscriberCountry'),
    subscriberCountryCode: cols.defaultVarchar('subscriberCountryCode'),
    paymentMeanId: cols.defaultVarchar('paymentMeanId'),
    amount: int('amount'),
    taxes: int('taxes'),
    rebillManagerId: cols.defaultVarchar('rebillManagerId'),
    status: mysqlEnum('status', ['active', 'canceled'])
      .notNull()
      .default('active'),
    canceledAt: cols.dateTime('canceledAt'),
  },
  table => {
    return {
      userIdWebCardId: primaryKey({
        columns: [table.userId, table.webCardId],
      }),
    };
  },
);

export type UserSubscription = InferSelectModel<typeof UserSubscriptionTable>;
export type NewUserSubscription = InferInsertModel<
  typeof UserSubscriptionTable
>;

/**
 * Add a subscription
 *
 * @param {string} userId
 * @param {string} subscriptionId
 * @param {Date} startAt
 * @param {Date} endAt
 * @param {DbTransaction} [trx=db]
 * @return {*}  {Promise<Subscription>}
 */
export const upsertSubscription = async (
  {
    userId,
    subscriptionId,
    startAt,
    endAt,
    revenueCatId,
    issuer,
    totalSeats,
    subscriptionPlan,
    status,
    canceledAt,
  }: NewUserSubscription | UserSubscription,
  trx: DbTransaction = db,
) => {
  const onDuplicateSet = {
    set: {
      subscriptionId,
      revenueCatId,
      startAt,
      endAt,
      subscriptionPlan,
      totalSeats,
      status,
      canceledAt,
    },
  };

  await trx
    .insert(UserSubscriptionTable)
    .values({
      userId,
      issuer,
      subscriptionId,
      revenueCatId,
      startAt,
      endAt,
      totalSeats,
      subscriptionPlan,
      status,
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

export const createSubscription = (
  subScription: NewUserSubscription,
  trx: DbTransaction = db,
) => {
  return trx.insert(UserSubscriptionTable).values(subScription);
};

/**
/**
 * Retrieve active subscription for given userId
 *
 * @param userId - The user id
 * @returns The subscription
 */
export const activeUserSubscription = async (
  userId: string,
  trx: DbTransaction = db,
): Promise<UserSubscription[] | undefined> => {
  const currentDate = new Date();
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        eq(UserSubscriptionTable.status, 'active'),
        gte(UserSubscriptionTable.endAt, currentDate),
      ),
    );
};

export const getActiveUserSubscriptionForWebCard = async (
  userId: string,
  webCardId: string,
  trx: DbTransaction = db,
) => {
  const currentDate = new Date();
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        or(
          eq(UserSubscriptionTable.webCardId, webCardId),
          eq(UserSubscriptionTable.webCardId, ''),
        ),
        eq(UserSubscriptionTable.status, 'active'),
        gte(UserSubscriptionTable.endAt, currentDate),
      ),
    );
};

export const getActiveWebCardSubscription = async (
  userId: string,
  webCardId: string,
  trx: DbTransaction = db,
) => {
  const currentDate = new Date();
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        eq(UserSubscriptionTable.webCardId, webCardId),
        eq(UserSubscriptionTable.status, 'active'),
        gte(UserSubscriptionTable.endAt, currentDate),
      ),
    )
    .then(res => res[0]);
};

export const getUserSubscriptionForWebCard = async (
  userId: string,
  webCardId: string,
  trx: DbTransaction = db,
) => {
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        eq(UserSubscriptionTable.webCardId, webCardId),
      ),
    )
    .then(res => res[0]);
};

export const getSubscriptionsOfUser = async (
  userId: string,
  trx: DbTransaction = db,
) => {
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.userId, userId));
};
