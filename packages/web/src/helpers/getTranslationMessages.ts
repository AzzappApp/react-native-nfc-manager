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

const getTranslationMessages = (locale = DEFAULT_LOCALE) => ({
  ...appMessages[locale],
  ...webMessages[locale],
});

export default getTranslationMessages;
