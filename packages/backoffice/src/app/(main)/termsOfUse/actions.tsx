'use server';

import * as Sentry from '@sentry/nextjs';
import { createTermsOfUse } from '@azzapp/data';

export async function createNewVersion(version: string) {
  try {
    if (version.length > 0) {
      await createTermsOfUse(version);
    } else {
      throw new Error('empty');
    }
  } catch (e) {
    if ((e as Error).message !== 'empty') {
      Sentry.captureException(e);
    }
    throw e;
  }
}
