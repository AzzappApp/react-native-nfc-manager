import { cache } from 'react';
import { getWebCardByUserName as domainGetWebcardByUserName } from '@azzapp/data';
import 'server-only';

export const cachedGetWebCardByUserName = cache(async (userName: string) =>
  domainGetWebcardByUserName(userName),
);
