import { PlatformEnvironmentProvider } from '@azzapp/app/lib/PlatformEnvironment';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { IntlErrorCode } from '@formatjs/intl';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { Suspense, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import { RecordSource } from 'relay-runtime';
import createPlatformEnvironment from '../helpers/createPlatformEnvironment';
import { getRelayEnvironment } from '../helpers/relayClient';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';
import type { AppProps } from 'next/app';
import type { MessageFormatElement } from 'react-intl';
import './styles.css';

const App = ({
  Component,
  pageProps,
}: AppProps<{
  initialRecords?: any;
  i18nMessages:
    | Record<string, MessageFormatElement[]>
    | Record<string, string>
    | undefined;
}>) => {
  const environment = getRelayEnvironment();

  if (pageProps.initialRecords) {
    environment.getStore().publish(new RecordSource(pageProps.initialRecords));
  }

  const nextRouter = useRouter();

  const platformEnvironment = useMemo<PlatformEnvironment>(
    () =>
      createPlatformEnvironment(
        typeof window === 'undefined'
          ? { pathname: nextRouter.pathname, query: nextRouter.query }
          : undefined,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const SuspenseFallback = (Component as any).fallback;

  const { defaultLocale, locale } = nextRouter;

  const onIntlError = (err: any) => {
    if (
      process.env.NODE_ENV !== 'production' &&
      err.code === IntlErrorCode.MISSING_TRANSLATION
    ) {
      return;
    }
    console.error(err);
  };
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <PlatformEnvironmentProvider value={platformEnvironment}>
        <RelayEnvironmentProvider environment={environment}>
          <IntlProvider
            locale={locale ?? DEFAULT_LOCALE}
            defaultLocale={defaultLocale ?? DEFAULT_LOCALE}
            messages={pageProps.i18nMessages}
            onError={onIntlError}
          >
            <Suspense
              fallback={
                SuspenseFallback ? <SuspenseFallback {...pageProps} /> : null
              }
            >
              <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <Component {...pageProps} />
              </SafeAreaProvider>
            </Suspense>
          </IntlProvider>
        </RelayEnvironmentProvider>
      </PlatformEnvironmentProvider>

      <Script id="vh-fix">{vhFixScript}</Script>
    </>
  );
};

export default App;

const vhFixScript = `
function applyVH() {
  document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
}
applyVH();
window.addEventListener('resize', applyVH);
`;
