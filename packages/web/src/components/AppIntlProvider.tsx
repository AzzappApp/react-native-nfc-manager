'use client';

import { useMemo, type PropsWithChildren } from 'react';
import { IntlProvider as BaseIntlProvider } from 'react-intl';
import { DEFAULT_LOCALE, guessLocale } from '@azzapp/i18n';
import { getTranslationMessages } from '@azzapp/service/i18nServices';

const AppIntlProvider = ({ children }: PropsWithChildren) => {
  // #region Internationalization
  const locale = guessLocale(navigator.language);

  const langMessages = useMemo(() => {
    let langMessages = getTranslationMessages(DEFAULT_LOCALE);
    if (locale !== DEFAULT_LOCALE) {
      langMessages = Object.assign(
        {},
        langMessages,
        getTranslationMessages(locale),
      );
    }
    return langMessages;
  }, [locale]);

  return (
    <BaseIntlProvider
      locale={locale}
      defaultLocale={DEFAULT_LOCALE}
      messages={langMessages}
    >
      {children}
    </BaseIntlProvider>
  );
};

export default AppIntlProvider;
