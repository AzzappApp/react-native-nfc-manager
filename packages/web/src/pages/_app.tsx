import { PlatformEnvironmentProvider } from '@azzapp/app/lib/PlatformEnvironment';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Suspense, useMemo } from 'react';
import { RelayEnvironmentProvider } from 'react-relay';
import { RecordSource } from 'relay-runtime';
import createPlatformEnvironment from '../helpers/createPlatformEnvironment';
import { getRelayEnvironment } from '../helpers/relayClient';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';
import type { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => {
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
          <Suspense
            fallback={
              SuspenseFallback ? <SuspenseFallback {...pageProps} /> : null
            }
          >
            <Component {...pageProps} />
          </Suspense>
        </RelayEnvironmentProvider>
      </PlatformEnvironmentProvider>
    </>
  );
};

export default App;
