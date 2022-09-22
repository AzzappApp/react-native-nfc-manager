import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@azzapp/i18n';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { findBestAvailableLanguage } from 'react-native-localize';

let currentLocale: string | null = null;
const localeChangeListeners: Array<() => void> = [];

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

const setCurrentLocale = () => {
  const locale = findBestAvailableLanguage(SUPPORTED_LOCALES);
  const lang = locale?.languageTag ?? DEFAULT_LOCALE;
  if (currentLocale !== lang) {
    currentLocale = lang;
    localeChangeListeners.forEach(listener => listener());
  }
};

export const init = () => {
  setCurrentLocale();
  let appState = AppState.currentState;
  AppState.addEventListener('change', nextAppState => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      setCurrentLocale();
    }
    appState = nextAppState;
  });
};

export const messages: { readonly [lang: string]: Record<string, string> } = {
  get en() {
    return require('@azzapp/i18n/compiled/app/en.json');
  },
  get fr() {
    return require('@azzapp/i18n/compiled/app/fr.json');
  },
};
