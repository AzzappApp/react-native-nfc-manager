import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  gte,
} from 'drizzle-orm';
import { text, mysqlTable, mysqlEnum, int } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const UserSubscriptionTable = mysqlTable('UserSubscription', {
  userId: cols.cuid('userId').primaryKey().notNull(),
  subscriptionId: text('subscriptionId').notNull(),
  totalSeats: int('totalSeats').default(0).notNull(),
  revenueCatId: text('revenueCatId'),
  issuer: mysqlEnum('issuer', ['apple', 'google', 'web']).notNull(), //web should be user over revenue cat
  startAt: cols.dateTime('startAt').notNull(),
  endAt: cols.dateTime('endAt').notNull(),
});

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
  }: UserSubscription,
  trx: DbTransaction = db,
) => {
  const onDuplicateSet = {
    set: {
      subscriptionId,
      revenueCatId,
      startAt,
      endAt,
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
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
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
        gte(UserSubscriptionTable.endAt, currentDate),
      ),
    );
};
