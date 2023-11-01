'use server';

import { headers } from 'next/headers';
import { updateStatistics } from '@azzapp/data/domains';

export const updateWebcardViews = async (profileId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  console.log('calling update web');
  return updateStatistics(profileId, 'webcardViews', true);
};
