'use server';

import { headers } from 'next/headers';
import {
  incrementWebCardViews,
  incrementContactCardScans,
  db,
  updateContactCardTotalScans,
} from '@azzapp/data/domains';

export const updateWebCardViewsCounter = async (webcardId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return incrementWebCardViews(webcardId);
};

export const updateContactCardScanCounter = async (profileId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return db.transaction(async tx => {
    await updateContactCardTotalScans(profileId, tx);
    await incrementContactCardScans(profileId, true, tx);
  });
};
