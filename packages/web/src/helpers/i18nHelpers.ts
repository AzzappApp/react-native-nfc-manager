import { createIntl, IntlErrorCode } from '@formatjs/intl';
import { cache } from 'react';
import { DEFAULT_LOCALE } from '@azzapp/i18n';

const appMessages: { readonly [lang: string]: Record<string, string> } = {
  get en() {
    return require('@azzapp/i18n/compiled/app/en.json');
  },
  get fr() {
    return require('@azzapp/i18n/compiled/app/fr.json');
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

export const getTranslationMessages = (locale = DEFAULT_LOCALE) => {
  const messages = Object.assign(
    {},
    appMessages[DEFAULT_LOCALE],
    webMessages[DEFAULT_LOCALE],
  );
  if (locale !== DEFAULT_LOCALE) {
    Object.assign(messages, appMessages[locale], webMessages[locale]);
  }
  return messages;
};

export const intlErrorHandler = (err: any) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    err.code === IntlErrorCode.MISSING_TRANSLATION
  ) {
    return;
  }
  console.error(err);
};

export const getServerIntl = cache((locale = DEFAULT_LOCALE) => {
  console.log(locale);
  const messages = getTranslationMessages(locale);
  return createIntl({ locale, messages, onError: intlErrorHandler });
});
