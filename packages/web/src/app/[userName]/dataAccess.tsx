import { cache } from 'react';
import { getWebCardByUserName as domainGetWebcardByUserName } from '@azzapp/data/domains';
import 'server-only';

export const cachedGetWebCardByUserName = cache(async (userName: string) =>
  domainGetWebcardByUserName(userName),
);
