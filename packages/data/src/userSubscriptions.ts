import { createId } from '@paralleldrive/cuid2';
import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  gte,
  or,
  ne,
  asc,
} from 'drizzle-orm';
import {
  text,
  mysqlTable,
  mysqlEnum,
  int,
  index,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const UserSubscriptionTable = mysqlTable(
  'UserSubscription',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
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

export const getSubscriptionsOfUser = async (
  userId: string,
  trx: DbTransaction = db,
) => {
  return trx
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.userId, userId));
};
