import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  findBestAvailableLanguage,
  getLocales as getLocalesRNLocalize,
} from 'react-native-localize';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@azzapp/i18n';
import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';

let currentLocale: string | null = null;
const localeChangeListeners: Array<() => void> = [];

/**
 * Returns the user preferred locales, in order.
 * On server, returns an empty array.
 *
 * @see https://github.com/zoontek/react-native-localize#getlocales
 */
export const getLocales = () => {
  if (getRuntimeEnvironment() === 'node') {
    return [];
  }
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

/**
 * Sets the current locale based on the user preferred locales.
 * If the user preferred locales are not supported, the default locale is used.
 */
const guessCurrentLocale = () => {
  const locale = findBestAvailableLanguage(SUPPORTED_LOCALES);
  const lang = locale?.languageTag ?? DEFAULT_LOCALE;
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
export const messages: { readonly [lang: string]: Record<string, string> } = {
  get en() {
    return require('@azzapp/i18n/compiled/app/en.json');
  },
  get fr() {
    return require('@azzapp/i18n/compiled/app/fr.json');
  },
};
