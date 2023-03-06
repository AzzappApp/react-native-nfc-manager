import { createIntl, IntlErrorCode } from '@formatjs/intl';
// @ts-expect-error createServerContext is not typed
import { cache, createServerContext, useContext } from 'react';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import type { createContext } from 'react';

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

export const getTranslationMessages = (locale = DEFAULT_LOCALE) => ({
  ...appMessages[locale],
  ...webMessages[locale],
});

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
  const messages = getTranslationMessages(locale);
  return createIntl({ locale, messages, onError: intlErrorHandler });
});

export const LocalServerContext = (
  createServerContext as typeof createContext
)<string>(DEFAULT_LOCALE);

export const useServerIntl = () => {
  const locale = useContext(LocalServerContext);
  return getServerIntl(locale);
};
