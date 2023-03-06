'use client';

import { useServerInsertedHTML } from 'next/navigation';
import React, { useMemo } from 'react';
import { IntlProvider } from 'react-intl';
// @ts-expect-error there is no types definition for react-native-web
import { StyleSheet } from 'react-native-web';
import { RelayEnvironmentProvider } from 'react-relay';
import { PlatformEnvironmentProvider } from '@azzapp/app/PlatformEnvironment';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import createRelayEnvironment from '@azzapp/shared/createRelayEnvironment';
import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';
import { intlErrorHandler } from '#helpers/i18nHelpers';
import useWebPlatformEnvironment from '#hooks/useWebPlatformEnvironment';

type ClientWrapperProps = {
  children: React.ReactNode;
  locale?: string | null;
  messages: Record<string, string>;
};

const ClientWrapper = ({ children, locale, messages }: ClientWrapperProps) => {
  const platformEnvironment = useWebPlatformEnvironment();

  const environment = useMemo(
    () =>
      createRelayEnvironment({ isServer: getRuntimeEnvironment() === 'node' }),
    [],
  );

  useServerInsertedHTML(() => {
    const sheet = StyleSheet.getSheet();
    return (
      <>
        <style
          dangerouslySetInnerHTML={{ __html: sheet.textContent }}
          id={sheet.id}
        />
      </>
    );
  });

  return (
    <PlatformEnvironmentProvider value={platformEnvironment}>
      <RelayEnvironmentProvider environment={environment}>
        <IntlProvider
          locale={locale ?? DEFAULT_LOCALE}
          defaultLocale={DEFAULT_LOCALE}
          messages={messages}
          onError={intlErrorHandler}
        >
          {children}
        </IntlProvider>
      </RelayEnvironmentProvider>
    </PlatformEnvironmentProvider>
  );
};
export default ClientWrapper;
