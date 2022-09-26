import { render } from '@testing-library/react-native';
import React, { useMemo } from 'react';
import { IntlProvider } from 'react-intl';

import { useNativeRouter } from '../lib/components/NativeRouter';
import createPlatformEnvironment from '../lib/helpers/createPlatformEnvironment';
import { PlatformEnvironmentProvider } from '../lib/PlatformEnvironment';
import type { NativeRouterInit } from '../lib/components/NativeRouter';
import type { ReactElement } from 'react';
const initialRoutes: NativeRouterInit = {
  stack: [
    {
      id: 'JEST_TAB',
      currentIndex: 0,
      tabs: [
        {
          id: 'TEST',
          route: 'HOME',
        },
      ],
    },
  ],
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const { router } = useNativeRouter(initialRoutes);
  const platformEnvironment = useMemo(
    () => createPlatformEnvironment(router),
    [router],
  );
  return (
    <PlatformEnvironmentProvider value={platformEnvironment}>
      <IntlProvider locale={'en'} defaultLocale={'en'} messages={{}}>
        {children}
      </IntlProvider>
    </PlatformEnvironmentProvider>
  );
};

const customRender = (ui: ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
