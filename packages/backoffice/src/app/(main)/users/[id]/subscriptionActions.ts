'use server';

import { revalidatePath } from 'next/cache';
import {
  createSubscription,
  getSubscriptionsOfUser,
  transaction,
  updateSubscription,
  createId,
} from '@azzapp/data';

export const setLifetimeSubscription = async (
  userId: string,
  active: boolean,
) => {
  await transaction(async () => {
    const existingLifetimeSubscription = (await getSubscriptionsOfUser(userId))
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
  status: 'active' | 'canceled',
) => {
  await updateSubscription(subscriptionId, {
    status,
    canceledAt: status === 'canceled' ? new Date() : null,
  });
  revalidatePath(`/users/${userId}`);
};
