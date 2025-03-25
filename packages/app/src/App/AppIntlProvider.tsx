import { useMemo, type ReactNode } from 'react';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { messages, useCurrentLocale } from '#helpers/localeHelpers';

const AppIntlProvider = ({ children }: { children: ReactNode }) => {
  // #region Internationalization
  const locale = useCurrentLocale();

  const langMessages = useMemo(() => {
    let langMessages = messages[DEFAULT_LOCALE];
    if (locale !== DEFAULT_LOCALE) {
      langMessages = Object.assign({}, langMessages, messages[locale]);
    }
    return langMessages;
  }, [locale]);

  const onIntlError = (err: any) => {
    if (__DEV__ && err.code === ReactIntlErrorCode.MISSING_TRANSLATION) {
      return;
    }
    console.error(err);
  };
  return (
    <IntlProvider
      locale={locale}
      defaultLocale={DEFAULT_LOCALE}
      messages={langMessages}
      onError={onIntlError}
    >
      {children}
    </IntlProvider>
  );
};

export default AppIntlProvider;
