'use client';

import { PlatformEnvironmentProvider } from '@azzapp/app/lib/PlatformEnvironment';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import createRelayEnvironment from '@azzapp/shared/lib/createRelayEnvironment';
import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';
import { IntlErrorCode } from '@formatjs/intl';
import React, { useCallback, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { RelayEnvironmentProvider } from 'react-relay';
import useWebPlatformEnvironment from '../../hooks/useWebPlatformEnvironment';

type ContextsProvidersProps = {
  children: React.ReactNode;
  locale?: string | null;
  messages: Record<string, string>;
};

const ContextsProviders = ({
  children,
  locale,
  messages,
}: ContextsProvidersProps) => {
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
export default ContextsProviders;
