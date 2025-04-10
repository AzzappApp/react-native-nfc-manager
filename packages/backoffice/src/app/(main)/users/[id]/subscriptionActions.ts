'use server';

import { revalidatePath } from 'next/cache';
import {
  createSubscription,
  transaction,
  updateSubscription,
  createId,
  getSubscriptionById,
  getUserSubscriptions,
} from '@azzapp/data';
import { endSubscription } from '@azzapp/payment';
import type { UserSubscription } from '@azzapp/data';

export const setLifetimeSubscription = async (
  userId: string,
  active: boolean,
) => {
  await transaction(async () => {
    const existingLifetimeSubscription = (
      await getUserSubscriptions({ userIds: [userId] })
    )
      .filter(s => s.subscriptionPlan === 'web.lifetime')
      .at(0);

    if (existingLifetimeSubscription) {
      await updateSubscription(existingLifetimeSubscription.id, {
        status: active ? 'active' : 'canceled',
        subscriptionId: existingLifetimeSubscription.id,
      });
    } else {
      await createSubscription({
        userId,
        subscriptionPlan: 'web.lifetime',
        subscriptionId: createId(),
        startAt: new Date(),
        endAt: new Date('2099-12-31'),
        issuer: 'web',
        totalSeats: 999999,
        status: active ? 'active' : 'canceled',
        canceledAt: active ? null : new Date(),
      });
    }
  });
  revalidatePath(`/users/${userId}`);
};

export const toggleSubscriptionStatusAction = async (
  userId: string,
  subscriptionId: string,
  subscriptionPlan: UserSubscription['subscriptionPlan'],
  status: 'active' | 'canceled',
) => {
  const cancelDate = new Date();

  const subscription = await getSubscriptionById(subscriptionId);
  if (
    subscription?.issuer === 'web' &&
    subscription?.subscriptionPlan !== 'web.lifetime'
  ) {
    await endSubscription(subscription);
  } else if (subscription?.subscriptionPlan === 'web.lifetime') {
    await updateSubscription(subscriptionId, {
      status,
      canceledAt: status === 'canceled' ? cancelDate : null,
      endAt:
        status === 'canceled' && subscriptionPlan === 'web.lifetime'
          ? cancelDate
          : undefined,
    });
  }
  revalidatePath(`/users/${userId}`);
};
