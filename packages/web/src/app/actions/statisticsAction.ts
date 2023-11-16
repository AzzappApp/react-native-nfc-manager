'use server';

import { headers } from 'next/headers';
import {
  incrementContactCardScans,
  incrementWebCardViews,
} from '@azzapp/data/domains';

export const updateWebcardViewsCounter = async (profileId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return incrementWebCardViews(profileId);
};

export const updateContactCardScanCounter = async (profileId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return incrementContactCardScans(profileId);
};
