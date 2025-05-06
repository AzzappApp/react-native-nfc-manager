'use client';

import React from 'react';
import { IntlProvider } from 'react-intl';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { intlErrorHandler } from '@azzapp/service/i18nServices';

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
      {children}
    </IntlProvider>
  );
};
export default ClientWrapper;
