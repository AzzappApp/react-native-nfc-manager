'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { UserSubscriptionTable, createSubscription, db } from '@azzapp/data';

import { createId } from '@azzapp/data/helpers/createId';

export const setLifetimeSubscription = async (
  userId: string,
  active: boolean,
) => {
  await db.transaction(async trx => {
    const existingLifetimeSubscription = await db
      .select()
      .from(UserSubscriptionTable)
      .where(
        and(
          eq(UserSubscriptionTable.userId, userId),
          eq(UserSubscriptionTable.subscriptionPlan, 'web.lifetime'),
        ),
      );

    if (existingLifetimeSubscription.length > 0) {
      await trx
        .update(UserSubscriptionTable)
        .set({
          status: active ? 'active' : 'canceled',
          canceledAt: active ? null : new Date(),
        })
        .where(
          and(
            eq(UserSubscriptionTable.userId, userId),
            eq(UserSubscriptionTable.subscriptionPlan, 'web.lifetime'),
          ),
        );
    } else {
      await createSubscription(
        {
          userId,
          subscriptionPlan: 'web.lifetime',
          subscriptionId: createId(),
          startAt: new Date(),
          endAt: new Date('2099-12-31'),
          issuer: 'web',
          totalSeats: 999999,
          status: active ? 'active' : 'canceled',
          canceledAt: active ? null : new Date(),
        },
        trx,
      );
    }
  });
  revalidatePath(`/users/${userId}`);
};

export const toggleSubscriptionStatusAction = async (
  userId: string,
  subscriptionId: string,
  status: 'active' | 'canceled',
) => {
  await db
    .update(UserSubscriptionTable)
    .set({
      status,
      canceledAt: status === 'canceled' ? new Date() : null,
    })
    .where(eq(UserSubscriptionTable.id, subscriptionId));
  revalidatePath(`/users/${userId}`);
};
