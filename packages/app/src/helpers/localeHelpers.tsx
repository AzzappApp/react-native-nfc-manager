import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getLocales as getLocalesRNLocalize } from 'react-native-localize';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@azzapp/i18n';
import type { Locale } from '@azzapp/i18n';

let currentLocale: Locale | null = null;
const localeChangeListeners: Array<() => void> = [];

/**
 * Returns the user preferred locales, in order.
 * On server, returns an empty array.
 *
 * @see https://github.com/zoontek/react-native-localize#getlocales
 */
export const getLocales = () => {
  return getLocalesRNLocalize();
};

/**
 * Returns the current locale used by the application.
 */
export const getCurrentLocale = () => {
  if (!currentLocale) {
    console.warn('trying to access `getCurrentLocale` before initialization');
  }
  return currentLocale ?? DEFAULT_LOCALE;
};

export const useCurrentLocale = () => {
  const [locale, setLocale] = useState(getCurrentLocale());
  useEffect(() => {
    const listener = () => {
      setLocale(getCurrentLocale());
    };
    localeChangeListeners.push(listener);

    return () => {
      const index = localeChangeListeners.indexOf(listener);
      if (index !== -1) {
        localeChangeListeners.splice(index, 1);
      }
    };
  }, []);
  return locale;
};

/* 
  Get the best supported language close to the languages set in the phone
  based first on the language tag and at least the languageCode based on the 
  2 first letters of supported languages
*/
const findBestLanguage = () => {
  const locales = getLocales();

  return locales.reduce<Locale | null>(
    (lang, { languageCode, languageTag }) =>
      lang ||
      SUPPORTED_LOCALES.find(tag => languageTag === tag) ||
      SUPPORTED_LOCALES.find(lang => lang.split('-')[0] === languageCode) ||
      null,
    null,
  );
};

/**
 * Sets the current locale based on the user preferred locales.
 * If the user preferred locales are not supported, the default locale is used.
 */
const guessCurrentLocale = () => {
  const lang = findBestLanguage() ?? DEFAULT_LOCALE;
  if (currentLocale !== lang) {
    currentLocale = lang;
    localeChangeListeners.forEach(listener => listener());
  }
};

/**
 * Initializes the locale helpers.
 */
export const init = () => {
  guessCurrentLocale();
  let appState = AppState.currentState;
  AppState.addEventListener('change', nextAppState => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      guessCurrentLocale();
    }
    appState = nextAppState;
  });
};

/**
 * Returns the current locale used by the application.
 */
export const messages: Record<Locale, Record<string, string>> = {
  get 'en-US'() {
    return require('@azzapp/i18n/compiled/app/en-US.json');
  },
  get fr() {
    return require('@azzapp/i18n/compiled/app/fr.json');
  },
  // disabled for now
  // get da() {
  //   return require('@azzapp/i18n/compiled/app/da.json');
  // },
  // get 'en-GB'() {
  //   return require('@azzapp/i18n/compiled/app/en-GB.json');
  // },
  get es() {
    return require('@azzapp/i18n/compiled/app/es.json');
  },
  // get fr() {
  //   return require('@azzapp/i18n/compiled/app/fr.json');
  // },
  // get it() {
  //  return require('@azzapp/i18n/compiled/app/it.json');
  // },
  // get nl() {
  //   return require('@azzapp/i18n/compiled/app/nl.json');
  // },
  // get no() {
  //   return require('@azzapp/i18n/compiled/app/no.json');
  // },
  // get 'pt-BR'() {
  //   return require('@azzapp/i18n/compiled/app/pt-BR.json');
  // },
  // get 'pt-PT'() {
  //   return require('@azzapp/i18n/compiled/app/pt-PT.json');
  // },
  // get sv() {
  //   return require('@azzapp/i18n/compiled/app/sv.json');
  // },
  get de() {
    return require('@azzapp/i18n/compiled/app/de.json');
  },
};
