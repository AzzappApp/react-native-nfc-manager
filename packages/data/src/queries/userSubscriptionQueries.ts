import {
  and,
  eq,
  gte,
  or,
  asc,
  isNull,
  desc,
  inArray,
  lt,
  count,
  like,
} from 'drizzle-orm';
import { db } from '../database';
import env from '../env';
import { createId } from '../helpers/createId';
import { UserSubscriptionTable } from '../schema';
import type { UserSubscription } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Create a new subscription
 *
 * @param newSubscription - The subscription to create
 * @returns The id of the created subscription
 */
export const createSubscription = (
  newSubscription: InferInsertModel<typeof UserSubscriptionTable>,
) =>
  db()
    .insert(UserSubscriptionTable)
    .values(newSubscription)
    .$returningId()
    .then(res => res[0].id);

/**
 * Update a subscription
 *
 * @param subscriptionId - The subscription id
 * @param updates - The updates to apply to the subscription
 */
export const updateSubscription = async (
  subscriptionId: string,
  updates: Partial<Omit<UserSubscription, 'id'>>,
) => {
  await db()
    .update(UserSubscriptionTable)
    .set(updates)
    .where(eq(UserSubscriptionTable.id, subscriptionId));
};

/**
 * Update a subscription by payment mean id
 *
 * @param paymentMeanId - The payment mean id of the subscription to update
 * @param updates - The updates to apply to the subscription
 */
export const updateSubscriptionByPaymentMeanId = async (
  paymentMeanId: string,
  updates: Partial<Omit<UserSubscription, 'id'>>,
) => {
  await db()
    .update(UserSubscriptionTable)
    .set(updates)
    .where(eq(UserSubscriptionTable.paymentMeanId, paymentMeanId));
};

/**
 * This function updates the free seats of a subscription
 *
 * @param subscriptionId - The subscription id
 * @param freeSeats - the new number of free seats
 */
export const updateSubscriptionFreeSeats = async (
  subscriptionId: string,
  freeSeats: number,
) => {
  await db()
    .update(UserSubscriptionTable)
    .set({ freeSeats })
    .where(eq(UserSubscriptionTable.id, subscriptionId));
};

export const getIAPSubscriptions = async (userId: string) => {
  return db()
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        eq(UserSubscriptionTable.userId, userId),
        or(
          eq(UserSubscriptionTable.issuer, 'apple'),
          eq(UserSubscriptionTable.issuer, 'google'),
        ),
      ),
    )
    .orderBy(
      desc(UserSubscriptionTable.startAt), // Finally, the most recently started subscriptions
    );
};

export const getUserSubscriptions = async ({
  userIds,
  issuers,
  onlyActive = false,
}: {
  userIds: string[];
  issuers?: Array<'apple' | 'google' | 'web'>;
  onlyActive?: boolean;
}) => {
  const currentDate = new Date();
  return db()
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        inArray(UserSubscriptionTable.userId, [...new Set(userIds)]),
        issuers?.length
          ? inArray(UserSubscriptionTable.issuer, issuers)
          : undefined,
        onlyActive
          ? or(
              eq(UserSubscriptionTable.status, 'active'),
              gte(UserSubscriptionTable.endAt, currentDate),
            )
          : undefined,
      ),
    )
    .orderBy(
      desc(eq(UserSubscriptionTable.status, 'active')), // Active subscriptions first
      desc(gte(UserSubscriptionTable.endAt, currentDate)), // Then subscriptions with endAt in the future
      desc(UserSubscriptionTable.startAt), // Finally, the most recently started subscriptions
    );
};

/**
 * Get a user subscription by its id
 *
 * @param id
 * @returns
 */
export const getSubscriptionById = async (
  id: string,
): Promise<UserSubscription | null> =>
  db()
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.id, id))
    .then(res => res[0] ?? null);

/**
 * Get a user subscription by payment mean id
 *
 * @param id
 * @returns
 */
export const getSubscriptionByPaymentMeanId = async (
  paymentMeanId: string,
): Promise<UserSubscription | null> =>
  db()
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.paymentMeanId, paymentMeanId))
    .then(res => res[0] ?? null);

export const cancelExpiredSubscription = async () => {
  const currentDate = new Date();
  return db()
    .update(UserSubscriptionTable)
    .set({
      status: 'canceled',
      canceledAt: currentDate,
    })
    .where(
      and(
        eq(UserSubscriptionTable.status, 'waiting_payment'),
        lt(UserSubscriptionTable.endAt, currentDate),
      ),
    );
};

export const cancelSubscription = async (userId: string) => {
  const currentDate = new Date();
  await db()
    .update(UserSubscriptionTable)
    .set({
      status: 'canceled',
      canceledAt: currentDate,
    })
    .where(and(eq(UserSubscriptionTable.userId, userId)));
};

export const getExpiredSubscription = async (limit: number) => {
  const currentDate = new Date();

  return db()
    .select()
    .from(UserSubscriptionTable)
    .where(
      and(
        lt(UserSubscriptionTable.endAt, currentDate),
        eq(UserSubscriptionTable.status, 'canceled'),
        isNull(UserSubscriptionTable.invalidatedAt),
      ),
    )
    .limit(limit);
};

export const updateActiveInAppUserSubscription = async (
  id: string,
  subscription: Partial<UserSubscription>,
) => {
  await db()
    .update(UserSubscriptionTable)
    .set(subscription)
    .where(
      and(
        eq(UserSubscriptionTable.id, id),
        or(
          eq(UserSubscriptionTable.issuer, 'apple'),
          eq(UserSubscriptionTable.issuer, 'google'),
        ),
      ),
    );
};

/**
 * Get the subscriptions paged
 *
 * @param args - The arguments to filter and sort the subscriptions
 * @param args.offset - The offset of the first subscription to retrieve
 * @param args.limit - The maximum number of subscriptions to retrieve
 * @param args.sortField - The column to sort the subscriptions by
 * @param args.sortOrder - The order to sort the subscriptions
 * @param args.search - The search string to filter the subscriptions
 * @param args.statusFilter - The status to filter the subscriptions
 * @param args.typeFilter - The type to filter the subscriptions
 *
 * @returns The subscriptions and the total number of subscriptions matching the filters
 */
export const getSubscriptionsPaged = async ({
  offset,
  limit,
  sortField = 'endAt',
  sortOrder = 'desc',
  search = null,
  statusFilter = 'all',
  typeFilter = 'all',
}: {
  offset: number;
  limit: number;
  sortField?: 'endAt' | 'issuer' | 'status' | 'subscriptionPlan';
  sortOrder?: 'asc' | 'desc';
  search?: string | null;
  statusFilter?: 'active' | 'all' | 'canceled' | 'waiting_payment';
  typeFilter?: 'all' | 'web.lifetime' | 'web.monthly' | 'web.yearly';
}) => {
  let query = db().select().from(UserSubscriptionTable).$dynamic();

  let countQuery = db()
    .select({ count: count() })
    .from(UserSubscriptionTable)
    .$dynamic();

  const filters: any = [];

  if (search) {
    filters.push(
      or(
        like(UserSubscriptionTable.userId, `%${search}%`),
        like(UserSubscriptionTable.issuer, `%${search}%`),
      ),
    );
  }

  if (statusFilter !== 'all') {
    filters.push(eq(UserSubscriptionTable.status, statusFilter));
  }

  if (typeFilter !== 'all') {
    filters.push(eq(UserSubscriptionTable.subscriptionPlan, typeFilter));
  }

  query = query.where(and(...filters));
  countQuery = countQuery.where(and(...filters));

  const sortFunc = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(sortFunc(UserSubscriptionTable[sortField]));

  const [subscriptions, nbSubscriptions] = await Promise.all([
    query.offset(offset).limit(limit),
    countQuery,
  ]);
  return {
    subscriptions,
    count: nbSubscriptions[0].count,
  };
};

const FREE_BETA_ANDROID_DATE_LIMIT = env.FREE_BETA_ANDROID_DATE_LIMIT;

export const createFreeSubscriptionForBetaAndroidPeriod = async (
  userId: string[],
) => {
  if (
    FREE_BETA_ANDROID_DATE_LIMIT &&
    !isNaN(Date.parse(FREE_BETA_ANDROID_DATE_LIMIT)) &&
    new Date() < new Date(FREE_BETA_ANDROID_DATE_LIMIT)
  ) {
    await db()
      .insert(UserSubscriptionTable)
      .values(
        userId.map(
          userId =>
            ({
              id: createId(),
              userId,
              subscriptionPlan: 'web.lifetime',
              subscriptionId: createId(),
              startAt: new Date(),
              endAt: new Date(FREE_BETA_ANDROID_DATE_LIMIT),
              issuer: 'web',
              totalSeats: 999999,
              status: 'active',
            }) as const,
        ),
      );
  }
};
