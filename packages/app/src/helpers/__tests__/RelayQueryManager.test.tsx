import { renderHook, act } from '@testing-library/react-hooks';
import { loadQuery } from 'react-relay';
import { getAuthState } from '#helpers/authStore';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from '#helpers/relayEnvironment';
import {
  loadQueryFor,
  disposeQueryFor,
  useManagedQuery,
  init,
} from '../RelayQueryManager';

jest.mock('react-relay');
jest.mock('../authStore');
jest.mock('../relayEnvironment');

describe('RelayQueryManager', () => {
  test('Query loading system', () => {
    jest.useFakeTimers();

    // Mock
    let envListener: (event: 'reset') => void = () => {};
    jest.mocked(addEnvironmentListener).mockImplementation(listener => {
      envListener = listener;
      return () => {};
    });
    (global as any).requestIdleCallback = (cb: () => void) => {
      cb();
    };

    const mockGetVariables = jest.fn().mockReturnValue({ test: 'test' });
    const profileInfos = {
      userId: 'fake-user-id',
      profileId: 'fake-profile-id',
    };
    jest
      .mocked(getRelayEnvironment)
      .mockReturnValue({ environment: 'fake-environment' } as any);
    jest.mocked(getAuthState).mockReturnValue({ profileInfos } as any);
    const mockDispose = jest.fn();
    let fetchTime: number = 0;
    jest.mocked(loadQuery).mockImplementation(
      () =>
        ({
          dispose: mockDispose,
          fetchTime: ++fetchTime,
        }) as any,
    );

    // Init
    init();
    const screenId = 'testScreen';
    const { result } = renderHook(() => useManagedQuery(screenId));
    const queryOptions = {
      query: { queryId: 'fake-query-id' } as any,
      getVariables: mockGetVariables,
      useOfflineCache: true,
      cacheOnly: false,
    };

    // Check initial first load
    act(() =>
      loadQueryFor(screenId, queryOptions, {
        routeParam: 'routeParam',
      }),
    );
    expect(mockGetVariables).toHaveBeenCalledWith(
      {
        routeParam: 'routeParam',
      },
      {
        userId: 'fake-user-id',
        profileId: 'fake-profile-id',
      },
    );
    expect(loadQuery).toHaveBeenCalledWith(
      { environment: 'fake-environment' },
      { queryId: 'fake-query-id' },
      { test: 'test' },
      {
        fetchPolicy: 'store-and-network',
        networkCacheConfig: {
          metadata: {
            useOfflineCache: true,
            cacheOnly: false,
          },
        },
      },
    );
    expect(result.current).toEqual({
      preloadedQuery: {
        fetchTime: 1,
        dispose: expect.any(Function),
      },
    });

    // Check that the query is not reloaded if it is already loaded
    act(() => {
      loadQueryFor(screenId, queryOptions);
    });
    expect(loadQuery).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
      preloadedQuery: {
        fetchTime: 1,
        dispose: expect.any(Function),
      },
    });

    // Check that the query is reloaded if refresh is true
    act(() => {
      loadQueryFor(screenId, queryOptions, {}, true);
    });
    expect(loadQuery).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({
      preloadedQuery: {
        fetchTime: 2,
        dispose: expect.any(Function),
      },
    });

    // Check that the dispose function is called when the query is disposed
    expect(mockDispose).not.toHaveBeenCalled();
    act(() => {
      disposeQueryFor(screenId);
    });
    expect(mockDispose).toHaveBeenCalled();
    expect(result.current).toBeNull();

    // Check that the dispose function is not called if the query is already disposed
    act(() => {
      disposeQueryFor(screenId);
    });
    expect(mockDispose).toHaveBeenCalledTimes(1);

    // Check that the query is reloaded if it is disposed and loaded again
    act(() => {
      loadQueryFor(screenId, queryOptions);
    });
    expect(loadQuery).toHaveBeenCalledTimes(3);
    expect(result.current).toEqual({
      preloadedQuery: {
        fetchTime: 3,
        dispose: expect.any(Function),
      },
    });

    // Check that the query is disposed when the environment is reset
    envListener('reset');
    expect(mockDispose).toHaveBeenCalledTimes(1);
    envListener('reset');
    expect(mockDispose).toHaveBeenCalledTimes(1);
    act(() => {
      jest.runAllTimers();
    });
    expect(mockDispose).toHaveBeenCalledTimes(2);
    expect(result.current).toBeNull();
  });
});
