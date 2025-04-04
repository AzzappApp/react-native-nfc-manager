import * as Sentry from '@sentry/react-native';
import { screen, act, fireEvent } from '@testing-library/react-native';
import { GraphQLError } from 'graphql';
import omit from 'lodash/omit';
import React, { createElement } from 'react';
import { Text } from 'react-native';
import { fetchQuery } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { TIMEOUT_ERROR_MESSAGE } from '@azzapp/shared/networkHelpers';
import { useNetworkAvailableContext } from '#networkAvailableContext';
import { useScreenHasFocus } from '#components/NativeRouter';
import { createMockRouter, render } from '#helpers/testHelpers';
import { useAppState } from '#hooks/useAppState';
import { addAuthStateListener, getAuthState } from '../authStore';
import {
  useManagedQuery,
  loadQueryFor,
  disposeQueryFor,
} from '../RelayQueryManager';
import relayScreen, {
  type RelayScreenProps,
  type RelayScreenOptions,
} from '../relayScreen';
import type { WebCardRoute } from '#routes';

jest.mock('react-relay', () => ({
  useRelayEnvironment: jest.fn().mockReturnValue({}),
  fetchQuery: jest.fn(),
}));

const mockRouter = createMockRouter();
jest.mock('#components/NativeRouter', () => ({
  ...jest.requireActual('#components/NativeRouter'),
  useRouter: () => mockRouter,
  useScreenHasFocus: jest.fn(),
}));

jest.mock('#networkAvailableContext', () => ({
  ...jest.requireActual('#networkAvailableContext'),
  useNetworkAvailableContext: jest.fn(),
}));

jest.mock('../RelayQueryManager', () => ({
  ...jest.requireActual('../RelayQueryManager'),
  useManagedQuery: jest.fn(),
  loadQueryFor: jest.fn(),
  disposeQueryFor: jest.fn(),
}));

jest.mock('../authStore', () => ({
  ...jest.requireActual('../authStore'),
  addAuthStateListener: jest.fn(),
  getAuthState: jest.fn(),
}));

jest.mock('#hooks/useAppState');
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

type FakeOperation = {
  response: { fakeField: string };
  variables: { id?: string };
};

const FakeScreenComponent: React.FC<
  RelayScreenProps<WebCardRoute, FakeOperation>
> = props => {
  return createElement('FakeScreenComponent', {
    testID: 'FakeScreenComponent',
    ...props,
  });
};

const options: RelayScreenOptions<WebCardRoute> = {
  query: {} as any,
  getVariables: params => ({ id: params.webCardId }),
  fallback: () => <Text>Loading...</Text>,
};

const renderRelayScreen = (
  additionalOptions?: Partial<RelayScreenOptions<WebCardRoute>>,
  additionalProps?: Partial<RelayScreenProps<WebCardRoute, FakeOperation>>,
  ScreenComponent = FakeScreenComponent,
) => {
  const FakeScreenWithRelay = relayScreen(ScreenComponent, {
    ...options,
    ...additionalOptions,
  });
  const result = render(
    <FakeScreenWithRelay
      screenId="FakeScreenId"
      route={{ route: 'WEBCARD', params: { webCardId: '123' } }}
      hasFocus
      {...additionalProps}
    />,
  );
  return {
    ...omit(result, 'rerender'),
    rerender(props: Partial<RelayScreenProps<WebCardRoute, FakeOperation>>) {
      return result.rerender(
        <FakeScreenWithRelay
          screenId="FakeScreenId"
          route={{ route: 'WEBCARD', params: { webCardId: '123' } }}
          hasFocus
          {...props}
        />,
      );
    },
  };
};

describe('relayScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useScreenHasFocus).mockReturnValue(true);
    jest.mocked(useNetworkAvailableContext).mockReturnValue(true);
    jest.mocked(useManagedQuery).mockReturnValue({ preloadedQuery: {} as any });
    jest
      .mocked(getAuthState)
      .mockReturnValue({ authenticated: false, profileInfos: null });
    jest.mocked(useAppState).mockReturnValue('active');
  });

  describe('Query management', () => {
    test('should load the query if not preloaded and render the fallback', () => {
      jest.mocked(useManagedQuery).mockReturnValue(null);
      renderRelayScreen();
      expect(loadQueryFor).toHaveBeenCalledWith(
        'FakeScreenId',
        expect.objectContaining({
          getVariables: options.getVariables,
          query: options.query,
        }),
        {
          webCardId: '123',
        },
      );
      expect(screen.queryByText('Loading...')).toBeTruthy();
    });

    test('should not load the query if the screen is not focused', () => {
      jest.mocked(useManagedQuery).mockReturnValue(null);
      jest.mocked(useScreenHasFocus).mockReturnValue(false);
      renderRelayScreen(undefined, { hasFocus: false });
      expect(loadQueryFor).not.toHaveBeenCalled();
      expect(screen.queryByText('Loading...')).toBeTruthy();
    });

    test('should not call load the query if the query is already preloaded', () => {
      const { toJSON } = renderRelayScreen();
      expect(loadQueryFor).not.toHaveBeenCalled();
      expect(toJSON()).toMatchInlineSnapshot(`
      <FakeScreenComponent
        hasFocus={true}
        preloadedQuery={{}}
        refreshQuery={[Function]}
        route={
          {
            "params": {
              "webCardId": "123",
            },
            "route": "WEBCARD",
          }
        }
        screenId="FakeScreenId"
        testID="FakeScreenComponent"
      />
    `);
    });

    test('should dispose the query if profile change when profileBound = true', () => {
      renderRelayScreen();
      const addAuthListenerCall = (addAuthStateListener as jest.Mock).mock
        .calls[0];
      const callback = addAuthListenerCall[0];

      act(() => {
        callback({ profileInfos: { userId: 'newUserId' } });
      });

      expect(disposeQueryFor).toHaveBeenCalledWith('FakeScreenId');
    });

    test('should not dispose the query if profile change when profileBound = true', () => {
      renderRelayScreen({ profileBound: false });
      const addAuthListenerCall = (addAuthStateListener as jest.Mock).mock
        .calls[0];
      const callback = addAuthListenerCall[0];

      act(() => {
        callback({ profileInfos: { userId: 'newUserId' } });
      });

      expect(disposeQueryFor).not.toHaveBeenCalledWith('FakeScreenId');
    });
  });

  describe('Polling', () => {
    test('should not poll the query if there is not poll interval', () => {
      jest.useFakeTimers();
      renderRelayScreen();
      jest.mocked(fetchQuery).mockReturnValue({
        subscribe: ({ complete }: any) => {
          setTimeout(() => {
            complete();
          }, 2000);
          return {
            unsubscribe() {},
            closed: false,
          };
        },
      } as any);
      jest.advanceTimersByTime(10000);
      expect(fetchQuery).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('should poll the query continuously if pollInterval is provided', () => {
      jest.useFakeTimers();
      renderRelayScreen({ pollInterval: 5000 });
      let nbCalls = 0;
      jest.mocked(fetchQuery).mockReturnValue({
        subscribe: ({ complete, error }: any) => {
          nbCalls++;
          setTimeout(() => {
            if (nbCalls >= 2 && nbCalls < 8) {
              error(new Error('Network down'));
            } else {
              complete();
            }
          }, 2000);
          return {
            unsubscribe() {},
            closed: false,
          };
        },
      } as any);
      expect(fetchQuery).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3000);
      expect(fetchQuery).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2000);
      expect(fetchQuery).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(5000);
      expect(fetchQuery).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(2000);
      expect(fetchQuery).toHaveBeenCalledTimes(2);
      // first error should retry after 2 seconds ( + 2 seconds of delay)
      jest.advanceTimersByTime(4000);
      expect(fetchQuery).toHaveBeenCalledTimes(3);
      // second error should retry after 4 seconds
      jest.advanceTimersByTime(6000);
      expect(fetchQuery).toHaveBeenCalledTimes(4);
      // third error should retry after 6 seconds
      jest.advanceTimersByTime(8000);
      expect(fetchQuery).toHaveBeenCalledTimes(5);
      // fourth error should retry after 8 seconds
      jest.advanceTimersByTime(10000);
      expect(fetchQuery).toHaveBeenCalledTimes(6);
      // fifth error should retry after 10 seconds
      jest.advanceTimersByTime(12000);
      expect(fetchQuery).toHaveBeenCalledTimes(7);
      // sixth error should not increase the delay (max 10 seconds)
      jest.advanceTimersByTime(12000);
      expect(fetchQuery).toHaveBeenCalledTimes(8);
      // No more error, should retry after 5 seconds
      jest.advanceTimersByTime(7000);
      expect(fetchQuery).toHaveBeenCalledTimes(9);

      jest.useRealTimers();
    });

    test('should not poll the query if the screen is not focused', () => {
      jest.useFakeTimers();
      const { rerender } = renderRelayScreen(
        { pollInterval: 5000 },
        { hasFocus: false },
      );
      jest.mocked(fetchQuery).mockReturnValue({
        subscribe: ({ complete }: any) => {
          setTimeout(() => {
            complete();
          }, 2000);
          return {
            unsubscribe() {},
            closed: false,
          };
        },
      } as any);
      jest.advanceTimersByTime(10000);
      expect(fetchQuery).not.toHaveBeenCalled();
      rerender({ hasFocus: true });
      jest.advanceTimersByTime(5000);
      expect(fetchQuery).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    test('should poll the query if the screen is not focused and stopPollingWhenNotFocused is false', () => {
      jest.useFakeTimers();
      renderRelayScreen(
        { pollInterval: 5000, stopPollingWhenNotFocused: false },
        { hasFocus: false },
      );
      jest.mocked(fetchQuery).mockReturnValue({
        subscribe: ({ complete }: any) => {
          setTimeout(() => {
            complete();
          }, 2000);
          return {
            unsubscribe() {},
            closed: false,
          };
        },
      } as any);
      jest.advanceTimersByTime(10000);
      expect(fetchQuery).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('Query refreshing', () => {
    test('should provide a refreshQuery function to the screen that forces query reloading', () => {
      const { getByTestId } = renderRelayScreen();
      expect(loadQueryFor).not.toHaveBeenCalled();

      const refreshQuery = getByTestId('FakeScreenComponent').props
        .refreshQuery;
      expect(refreshQuery).toBeInstanceOf(Function);
      refreshQuery();
      expect(loadQueryFor).toHaveBeenCalledWith(
        'FakeScreenId',
        expect.objectContaining({
          getVariables: options.getVariables,
          query: options.query,
        }),
        { webCardId: '123' },
        true,
      );
    });

    test('should refresh the query if the screen is focused again if refreshOnFocus is true', () => {
      const { rerender } = renderRelayScreen({ refreshOnFocus: true });
      expect(loadQueryFor).not.toHaveBeenCalled();
      rerender({ hasFocus: false });
      rerender({ hasFocus: true });
      expect(loadQueryFor).toHaveBeenCalledTimes(1);
    });

    test('should refresh the query when app state changes if refreshOnFocus is true', () => {
      jest.mocked(useAppState).mockReturnValue('background');
      const { rerender } = renderRelayScreen({ refreshOnFocus: true });
      expect(loadQueryFor).not.toHaveBeenCalled();
      jest.mocked(useAppState).mockReturnValue('active');
      rerender({});
      expect(loadQueryFor).toHaveBeenCalledTimes(1);
    });

    test('should refresh the query when the network is available if refreshOnFocus is true', () => {
      jest.mocked(useNetworkAvailableContext).mockReturnValue(false);
      const { rerender } = renderRelayScreen({ refreshOnFocus: true });
      expect(loadQueryFor).not.toHaveBeenCalled();
      jest.mocked(useNetworkAvailableContext).mockReturnValue(true);
      rerender({});
      expect(loadQueryFor).toHaveBeenCalledTimes(1);
    });

    test('should not refresh the query when refreshOnFocus is false', () => {
      const { rerender } = renderRelayScreen({ refreshOnFocus: false });
      expect(loadQueryFor).not.toHaveBeenCalled();
      jest.mocked(useAppState).mockReturnValue('background');
      jest.mocked(useNetworkAvailableContext).mockReturnValue(false);
      rerender({ hasFocus: false });
      jest.mocked(useAppState).mockReturnValue('active');
      jest.mocked(useNetworkAvailableContext).mockReturnValue(true);
      rerender({ hasFocus: true });
      expect(loadQueryFor).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    const realError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });
    afterEach(() => {
      console.error = realError;
    });

    test('should display error screen if there is a relay error', () => {
      renderRelayScreen(undefined, undefined, () => {
        throw new GraphQLError('Fake error');
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        new GraphQLError('Fake error'),
        { data: 'relayScreen' },
      );
      expect(screen.queryByText('Loading error')).toBeTruthy();
    });

    test('should display the `something went wrong` screen if there is an unknown error', () => {
      renderRelayScreen(undefined, undefined, () => {
        throw new Error('Fake error');
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Fake error'),
        { data: 'relayScreen' },
      );
      expect(screen.queryByText('Something went wrong')).toBeTruthy();
    });

    test('should display the loading fallback for NetworkError', () => {
      renderRelayScreen(undefined, undefined, () => {
        throw new TypeError('Network request failed');
      });
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(screen.queryByText('Loading...')).toBeTruthy();
    });

    test('should display the loading fallback for timeout error', () => {
      renderRelayScreen(undefined, undefined, () => {
        throw new TypeError(TIMEOUT_ERROR_MESSAGE);
      });
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(screen.queryByText('Loading...')).toBeTruthy();
    });

    test('should display the loading fallback for INVALID_TOKEN error', () => {
      renderRelayScreen(undefined, undefined, () => {
        throw new Error(ERRORS.INVALID_TOKEN);
      });
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(screen.queryByText('Loading...')).toBeTruthy();
    });

    test('should clear the error if the error is reset', () => {
      let dispatchError = true;
      renderRelayScreen(undefined, undefined, () => {
        if (dispatchError) {
          throw new GraphQLError('Fake error');
        }
        return <Text>Screen displayed</Text>;
      });
      expect(screen.queryByText('Loading error')).toBeTruthy();
      dispatchError = false;
      act(() => fireEvent(screen.getAllByRole('button')[1], 'press'));
      expect(screen.queryByText('Screen displayed')).toBeTruthy();
    });
  });
});
