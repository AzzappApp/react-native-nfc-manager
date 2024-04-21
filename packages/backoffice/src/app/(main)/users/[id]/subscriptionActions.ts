'use server';

import { revalidatePath } from 'next/cache';
import { upsertSubscription } from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';

export const setLifetimeSubscription = async (
  userId: string,
  active: boolean,
) => {
  console.log('setLifetimeSubscription', userId, active);
  await upsertSubscription({
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
  console.log('setLifetimeSubscription done');
  revalidatePath(`/users/${userId}`);
};
