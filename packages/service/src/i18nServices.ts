import { createIntl, IntlErrorCode } from '@formatjs/intl';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import type { Locale } from '@azzapp/i18n';

const webMessages: Record<Locale, Record<string, string>> = {
  get 'en-US'() {
    return require('@azzapp/i18n/compiled/web/en-US.json');
  },
  get fr() {
    return require('@azzapp/i18n/compiled/web/fr.json');
  },
  // disabled for now
  // get da() {
  //   return require('@azzapp/i18n/compiled/web/da.json');
  // },
  // get 'en-GB'() {
  //   return require('@azzapp/i18n/compiled/web/en-GB.json');
  // },
  get es() {
    return require('@azzapp/i18n/compiled/web/es.json');
  },
  // get fr() {
  //   return require('@azzapp/i18n/compiled/web/fr.json');
  // },
  get it() {
    return require('@azzapp/i18n/compiled/web/it.json');
  },
  // get nl() {
  //   return require('@azzapp/i18n/compiled/web/nl.json');
  // },
  // get no() {
  //   return require('@azzapp/i18n/compiled/web/no.json');
  // },
  // get 'pt-BR'() {
  //   return require('@azzapp/i18n/compiled/web/pt-BR.json');
  // },
  // get 'pt-PT'() {
  //   return require('@azzapp/i18n/compiled/web/pt-PT.json');
  // },
  // get sv() {
  //   return require('@azzapp/i18n/compiled/web/sv.json');
  // },
  get de() {
    return require('@azzapp/i18n/compiled/web/de.json');
  },
};
export const getTranslationMessages = (locale: Locale = DEFAULT_LOCALE) => {
  const messages = Object.assign({}, webMessages[DEFAULT_LOCALE]);
  if (locale !== DEFAULT_LOCALE) {
    Object.assign(messages, webMessages[locale]);
  }
  return messages;
};

// TODO: I don't like the fact that this error handler is in the service package
export const intlErrorHandler = (err: any) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    err.code === IntlErrorCode.MISSING_TRANSLATION
  ) {
    return;
  }
  console.error(err);
};

export const createServerIntl = (locale = DEFAULT_LOCALE) => {
  const messages = getTranslationMessages(locale);
  return createIntl({ locale, messages, onError: intlErrorHandler });
};
