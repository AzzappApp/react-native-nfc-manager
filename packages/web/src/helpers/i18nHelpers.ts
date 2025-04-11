import { cache } from 'react';
import { createServerIntl } from '@azzapp/service/i18nServices';
import type { Locale } from '@azzapp/i18n';

export const getServerIntl = cache((locale?: Locale) => {
  return createServerIntl(locale);
});
