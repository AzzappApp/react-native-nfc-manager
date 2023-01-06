'use client';

import { PlatformEnvironmentProvider } from '@azzapp/app/lib/PlatformEnvironment';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import createRelayEnvironment from '@azzapp/shared/lib/createRelayEnvironment';
import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';
import { IntlErrorCode } from '@formatjs/intl';
import { useServerInsertedHTML } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
// @ts-expect-error there is no types definition for react-native-web
import { StyleSheet } from 'react-native-web';
import { RelayEnvironmentProvider } from 'react-relay';
import useWebPlatformEnvironment from '../../hooks/useWebPlatformEnvironment';

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

  const onIntlError = useCallback((err: any) => {
    if (
      process.env.NODE_ENV !== 'production' &&
      err.code === IntlErrorCode.MISSING_TRANSLATION
    ) {
      return;
    }
    console.error(err);
  }, []);

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
          onError={onIntlError}
        >
          {children}
        </IntlProvider>
      </RelayEnvironmentProvider>
    </PlatformEnvironmentProvider>
  );
};
export default ClientWrapper;
