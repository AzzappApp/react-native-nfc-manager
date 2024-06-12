import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  gte,
  or,
  ne,
  asc,
  isNull,
  desc,
} from 'drizzle-orm';
import {
  text,
  mysqlTable,
  mysqlEnum,
  int,
  index,
} from 'drizzle-orm/mysql-core';
import { createId } from '#/helpers/createId';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const UserSubscriptionTable = mysqlTable(
  'UserSubscription',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.cuid('webCardId'),
    subscriptionId: text('subscriptionId').notNull(),
    subscriptionPlan: cols.enum('subscriptionPlan', [
      'web.monthly',
      'web.yearly',
      'web.lifetime',
    ]),
    totalSeats: int('totalSeats').default(0).notNull(),
    freeSeats: int('freeSeats').default(0).notNull(),
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
    status: mysqlEnum('status', ['active', 'canceled', 'waiting_payment'])
      .notNull()
      .default('active'),
    canceledAt: cols.dateTime('canceledAt'),
  },
  table => {
    return {
      userIdWebCardIDIdx: index('userId_webCardId_idx').on(
        table.userId,
        table.webCardId,
      ),
    };
  },
);

export type UserSubscription = InferSelectModel<typeof UserSubscriptionTable>;
export type NewUserSubscription = InferInsertModel<
  typeof UserSubscriptionTable
>;

export const createSubscription = async (
  subscription: NewUserSubscription,
  trx: DbTransaction = db,
) => {
  const id = createId();
  await trx.insert(UserSubscriptionTable).values({ ...subscription, id });
  return id;
};

export const updateActiveUserSubscription = async (
  userId: string,
  subscription: Partial<UserSubscription>,
) => {
  await db
    .update(UserSubscriptionTable)
    .set(subscription)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        isNull(UserSubscriptionTable.webCardId),
        ne(UserSubscriptionTable.status, 'canceled'),
      ),
    );
};

export const updateSubscriptionFreeSeats = async (
  subscriptionId: string,
  freeSeats: number,
) => {
  await db
    .update(UserSubscriptionTable)
    .set({ freeSeats })
    .where(eq(UserSubscriptionTable.id, subscriptionId));
};

/**
 * Retrieve active subscription for given userId
 * @param userId - The user id
 * @param excludeWebCards - Exclude subscriptions with webCardId
 * @returns The subscription
 */
export const activeUserSubscription = async (
  userId: string,
  excludeWebCards: boolean = false,
  trx: DbTransaction = db,
): Promise<UserSubscription[]> => {
  const currentDate = new Date();
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        or(
          eq(UserSubscriptionTable.status, 'active'),
          gte(UserSubscriptionTable.endAt, currentDate),
        ),
        excludeWebCards ? isNull(UserSubscriptionTable.webCardId) : undefined,
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
          isNull(UserSubscriptionTable.webCardId),
        ),
        or(
          eq(UserSubscriptionTable.status, 'active'),
          gte(UserSubscriptionTable.endAt, currentDate),
        ),
      ),
    )
    .orderBy(asc(UserSubscriptionTable.status));
};

export const getActiveWebCardSubscription = async (
  webCardId: string,
  trx: DbTransaction = db,
) => {
  const currentDate = new Date();
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.webCardId, webCardId),
        or(
          eq(UserSubscriptionTable.status, 'active'),
          gte(UserSubscriptionTable.endAt, currentDate),
        ),
      ),
    )
    .then(res => res[0]);
};

export const getSubscriptionById = async (
  id: string,
  trx: DbTransaction = db,
) => {
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.id, id))
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
        ne(UserSubscriptionTable.status, 'canceled'),
      ),
    )
    .orderBy(asc(UserSubscriptionTable.status))
    .then(res => res[0]);
};

export const getLastSubscription = async (
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
    .orderBy(desc(UserSubscriptionTable.startAt))
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
