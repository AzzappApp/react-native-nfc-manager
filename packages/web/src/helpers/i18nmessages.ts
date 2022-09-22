import { DEFAULT_LOCALE } from '@azzapp/i18n';
import pick from 'lodash/pick';

const appMessages: { readonly [lang: string]: Record<string, string> } = {
  get en() {
    if (process.env.NODE_ENV !== 'production') {
      return require('@azzapp/i18n/compiled/app/en.json');
    } else {
      return require('@azzapp/i18n/compiled/app/en.json');
    }
  },
  get fr() {
    if (process.env.NODE_ENV !== 'production') {
      return require('@azzapp/i18n/compiled/app/fr.json');
    } else {
      return require('@azzapp/i18n/compiled/app/fr.json');
    }
  },
};

const webMessages: { readonly [lang: string]: Record<string, string> } = {
  get en() {
    return require('@azzapp/i18n/compiled/web/en.json');
  },
  get fr() {
    return require('@azzapp/i18n/compiled/web/fr.json');
  },
};

const pageDependencies: Record<
  string,
  string[]
  // eslint-disable-next-line @typescript-eslint/no-var-requires
> = require('@azzapp/i18n/pagesMessagesDependencies.json');

export const getMessages = (page: string, locale = DEFAULT_LOCALE) => {
  const messages = { ...appMessages[locale], ...webMessages[locale] };
  return pick(messages, pageDependencies[page]);
};
