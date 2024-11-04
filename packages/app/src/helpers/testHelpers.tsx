import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { render } from '@testing-library/react-native';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RouterProvider, useNativeRouter } from '#components/NativeRouter';
import type { RouterInit } from '#components/NativeRouter';
import type { RenderResult } from '@testing-library/react-native';
import type { ReactElement } from 'react';
const initialRoutes: RouterInit = {
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

jest.mock('#helpers/ScreenPrefetcher');

jest.mock('react-intl', () => {
  const reactIntl = jest.requireActual('react-intl');
  return {
    ...reactIntl,
    FormattedRelativeTime: ({ value }: { value: number }) => value,
  };
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const { router } = useNativeRouter(initialRoutes);

  return (
    <RouterProvider value={router}>
      <BottomSheetModalProvider>
        <IntlProvider
          textComponent={Text}
          locale="fr"
          defaultLocale="fr"
          messages={{}}
        >
          <SafeAreaProvider>{children}</SafeAreaProvider>
        </IntlProvider>
      </BottomSheetModalProvider>
    </RouterProvider>
  );
};

/**
 * A custom render function to wrap all the providers
 * @see https://testing-library.com/docs/react-testing-library/setup#custom-render
 *
 * @param ui
 * @param options
 * @returns
 */
const customRender = (ui: ReactElement, options?: any): RenderResult =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
