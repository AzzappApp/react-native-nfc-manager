'use client';

import React from 'react';
import { IntlProvider } from 'react-intl';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { intlErrorHandler } from '#helpers/i18nHelpers';
import AndroidAppDownloadBanner from './AndroidAppDownloadBanner';

export type ClientWrapperProps = {
  children: IntlProvider['props']['children'];
  locale?: string | null;
  messages: Record<string, string>;
};

const ClientWrapper = ({ children, locale, messages }: ClientWrapperProps) => {
  return (
    <IntlProvider
      locale={locale ?? DEFAULT_LOCALE}
      defaultLocale={DEFAULT_LOCALE}
      messages={messages}
      onError={intlErrorHandler}
    >
      <AndroidAppDownloadBanner />
      {children}
    </IntlProvider>
  );
};
export default ClientWrapper;
