import { render } from '@testing-library/react-native';
import React, { useMemo } from 'react';
import { IntlProvider } from 'react-intl';

import { Text } from 'react-native';
import { PlatformEnvironmentProvider } from '#PlatformEnvironment';
import { useNativeRouter } from '#components/NativeRouter';
import createPlatformEnvironment from '#helpers/createPlatformEnvironment';
import type { NativeRouterInit } from '#components/NativeRouter';
import type { ReactElement } from 'react';
const initialRoutes: NativeRouterInit = {
  id: 'test',
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
      <IntlProvider
        textComponent={Text}
        locale="fr"
        defaultLocale="fr"
        messages={{}}
      >
        {children}
      </IntlProvider>
    </PlatformEnvironmentProvider>
  );
};

const customRender = (ui: ReactElement, options?: any): any =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
