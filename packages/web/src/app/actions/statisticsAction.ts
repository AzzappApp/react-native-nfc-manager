'use server';

import { headers } from 'next/headers';
import {
  incrementWebCardViews,
  incrementContactCardScans,
  incrementContactCardTotalScans,
  transaction,
} from '@azzapp/data';

export const updateWebCardViewsCounter = async (webcardId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  await headers();
  return incrementWebCardViews(webcardId);
};

export const updateContactCardScanCounter = async (profileId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  await headers();
  return transaction(async () => {
    await incrementContactCardTotalScans(profileId);
    await incrementContactCardScans(profileId, true);
  });
};
