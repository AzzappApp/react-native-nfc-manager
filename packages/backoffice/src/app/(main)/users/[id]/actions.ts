'use server';

import { updateSubscriptionFreeSeats } from '@azzapp/data';

export const updateFreeSeatsAction = async (
  subscriptionId: string,
  nbSeats: number,
) => {
  await updateSubscriptionFreeSeats(subscriptionId, nbSeats);
};
