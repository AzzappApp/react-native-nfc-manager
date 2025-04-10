import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { render } from '@testing-library/react-native';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ContextUploadProvider } from '#components/CoverEditor/CoverUploadContext';
import { RouterProvider, useNativeRouter } from '#components/NativeRouter';
import type { NativeRouter, RouterInit } from '#components/NativeRouter';
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
        <ContextUploadProvider>
          <IntlProvider
            textComponent={Text}
            locale="fr"
            defaultLocale="fr"
            messages={{}}
          >
            <SafeAreaProvider>{children}</SafeAreaProvider>
          </IntlProvider>
        </ContextUploadProvider>
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

export const createMockRouter = (): jest.MockedObject<NativeRouter> => ({
  getCurrentRoute: jest.fn(),
  getCurrentRouterState: jest.fn(),
  getCurrentScreenId: jest.fn(),
  canGoBack: jest.fn(),

  // navigation
  push: jest.fn(),
  back: jest.fn(),
  pop: jest.fn(),
  replace: jest.fn(),
  splice: jest.fn(),
  replaceAll: jest.fn(),
  backToTop: jest.fn(),

  // listeners
  addRouteWillChangeListener: jest.fn(),
  addRouteDidChangeListener: jest.fn(),
  addScreenWillBePushedListener: jest.fn(),
  addScreenWillBeRemovedListener: jest.fn(),
  addModalCloseRequestListener: jest.fn(),

  // modals
  showModal: jest.fn(),
  updateModal: jest.fn(),
  hideModal: jest.fn(),
  addModalInterceptor: jest.fn(),
  __screenDismissed: jest.fn(),
});
