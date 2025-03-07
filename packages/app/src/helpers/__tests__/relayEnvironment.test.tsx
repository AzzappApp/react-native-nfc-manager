import { flushPromises } from '@azzapp/shared/jestHelpers';
import { createAbortError } from '@azzapp/shared/networkHelpers';
import { addAuthStateListener, getAuthState } from '#helpers/authStore';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import type { AuthState } from '#helpers/authStore';

jest.mock('#helpers/authStore');
jest.mock('#helpers/globalEvents');
const mockFetch = jest.fn();
jest.mock('#helpers/fetchWithGlobalEvents', () => () => mockFetch);

describe('relayEnvironment', () => {
  const authListeners: Array<(state: AuthState) => void> = [];
  const dispatchAuthState = (state: AuthState) => {
    authListeners.forEach(listener => listener(state));
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let relayEnvironment: typeof import('../relayEnvironment');

  beforeEach(() => {
    jest.resetAllMocks();
    authListeners.length = 0;
    jest.mocked(addAuthStateListener).mockImplementation(listener => {
      authListeners.push(listener);
      return () => {};
    });
    jest
      .mocked(getAuthState)
      .mockReturnValue({ authenticated: false, profileInfos: null });

    jest.mocked(dispatchGlobalEvent).mockResolvedValue();
    jest.isolateModules(() => {
      relayEnvironment = require('../relayEnvironment');
      require('#helpers/localeHelpers').init();
    });
  });

  test('relayEnvironment.getRelayEnvironment should create the environment if it does not exist', () => {
    const environment = relayEnvironment.getRelayEnvironment();
    expect(environment).not.toBeNull();
    expect(relayEnvironment.getRelayEnvironment()).toBe(environment);
  });

  test('the environment should be recreated when the user log out', () => {
    const environmentListener = jest.fn();
    relayEnvironment.addEnvironmentListener(environmentListener);

    const environment = relayEnvironment.getRelayEnvironment();
    dispatchAuthState({ authenticated: true, profileInfos: null });
    expect(environmentListener).not.toHaveBeenCalled();
    expect(relayEnvironment.getRelayEnvironment()).toBe(environment);

    dispatchAuthState({ authenticated: false, profileInfos: null });
    const newEnvironment = relayEnvironment.getRelayEnvironment();
    expect(newEnvironment).not.toBe(null);
    expect(newEnvironment).not.toBe(environment);
    expect(environmentListener).toHaveBeenCalledTimes(1);
  });

  describe('Network', () => {
    test('should fetch the query', async () => {
      expect.assertions(2);
      const environment = relayEnvironment.getRelayEnvironment();

      mockFetch.mockResolvedValueOnce({
        data: { hello: 'world' },
      });
      const observable = environment.getNetwork().execute(
        {
          cacheID: '123',
          id: null,
          text: 'query { hello }',
          name: 'TestQuery',
          operationKind: 'query',
          metadata: {},
        },
        { id: 123 },
        {},
      );
      observable.subscribe({
        next: response => {
          expect(response).toEqual({ data: { hello: 'world' } });
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching('/graphql'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'query { hello }',
            variables: { id: 123 },
          }),
        }),
      );

      await flushPromises();
    });

    test('should fetch precompiled query', async () => {
      expect.assertions(2);
      const environment = relayEnvironment.getRelayEnvironment();

      mockFetch.mockResolvedValueOnce({
        data: { hello: 'world' },
      });
      const observable = environment.getNetwork().execute(
        {
          id: '123',
          text: null,
          name: 'TestQuery',
          operationKind: 'query',
          metadata: {},
        },
        { id: 123 },
        {},
      );
      observable.subscribe({
        next: response => {
          expect(response).toEqual({ data: { hello: 'world' } });
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching('/graphql'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            id: '123',
            variables: { id: 123 },
          }),
        }),
      );

      await flushPromises();
    });
  });

  test('should throw GraphQLError on API error', async () => {
    expect.assertions(2);
    mockFetch.mockResolvedValueOnce({ errors: [{ message: 'API Error' }] });

    const observable = relayEnvironment
      .getRelayEnvironment()
      .getNetwork()
      .execute(
        {
          cacheID: '123',
          id: null,
          text: 'query { hello }',
          name: 'TestQuery',
          operationKind: 'query',
          metadata: {},
        },
        {},
        {},
      );

    observable.subscribe({
      error: (error: any) => {
        expect(error).toBeInstanceOf(relayEnvironment.GraphQLError);
      },
    });

    await flushPromises();
    expect(dispatchGlobalEvent).toHaveBeenCalledWith({
      type: 'NETWORK_ERROR',
      payload: {
        error: expect.any(relayEnvironment.GraphQLError),
        params: expect.any(Object),
      },
    });
  });

  test('should throw on network error', async () => {
    expect.assertions(1);
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const observable = relayEnvironment
      .getRelayEnvironment()
      .getNetwork()
      .execute(
        {
          cacheID: '123',
          id: null,
          text: 'query { hello }',
          name: 'TestQuery',
          operationKind: 'query',
          metadata: {},
        },
        {},
        {},
      );

    observable.subscribe({
      error: (error: any) => {
        expect(error).toBeInstanceOf(TypeError);
      },
    });

    await flushPromises();
  });

  test('should complete on abort', async () => {
    expect.assertions(1);
    mockFetch.mockRejectedValueOnce(createAbortError());

    const observable = relayEnvironment
      .getRelayEnvironment()
      .getNetwork()
      .execute(
        {
          cacheID: '123',
          id: null,
          text: 'query { hello }',
          name: 'TestQuery',
          operationKind: 'query',
          metadata: {},
        },
        {},
        {},
      );

    observable.subscribe({
      complete: () => {
        expect(true).toBe(true);
      },
    });

    await flushPromises();
  });

  test('should cache the query if `useOfflineCache` is used', async () => {
    jest.mocked(getAuthState).mockReturnValue({
      authenticated: true,
      //@ts-expect-error we don't care about the profileInfos for this test
      profileInfos: {
        userId: 'fake-user-id',
      },
    });
    const environment = relayEnvironment.getRelayEnvironment();

    const results: any[] = [];
    const doFetch = () => {
      environment
        .getNetwork()
        .execute(
          {
            id: '123',
            text: null,
            name: 'TestQuery',
            operationKind: 'query',
            metadata: {},
          },
          {},
          {
            metadata: {
              useOfflineCache: true,
            },
          },
        )
        .subscribe({
          next: response => {
            results.push(response);
          },
        });
    };

    mockFetch.mockResolvedValueOnce({
      data: { hello: 'world' },
    });
    doFetch();
    await flushPromises();
    mockFetch.mockResolvedValueOnce({
      data: { hello: 'all the world' },
    });
    doFetch();
    await flushPromises();

    expect(results).toEqual([
      { data: { hello: 'world' } },
      { data: { hello: 'world' } }, // cached result
      { data: { hello: 'all the world' } },
    ]);
  });

  test('should only retrieve cached query with cache only', async () => {
    jest.mocked(getAuthState).mockReturnValue({
      authenticated: true,
      //@ts-expect-error we don't care about the profileInfos for this test
      profileInfos: {
        userId: 'fake-user-id',
      },
    });
    const environment = relayEnvironment.getRelayEnvironment();

    const results: any[] = [];
    const doFetch = (cacheOnly: boolean) => {
      environment
        .getNetwork()
        .execute(
          {
            id: '123',
            text: null,
            name: 'TestQuery',
            operationKind: 'query',
            metadata: {},
          },
          {},
          {
            metadata: {
              useOfflineCache: true,
              cacheOnly,
            },
          },
        )
        .subscribe({
          next: response => {
            results.push(response);
          },
        });
    };

    mockFetch.mockResolvedValueOnce({
      data: { hello: 'world' },
    });
    doFetch(false);
    await flushPromises();
    mockFetch.mockResolvedValueOnce({
      data: { hello: 'all the world' },
    });
    doFetch(true);
    await flushPromises();

    expect(results).toEqual([
      { data: { hello: 'world' } },
      { data: { hello: 'world' } }, // cached result
    ]);
  });

  test('should throw an error when using cache with mutation', async () => {
    expect.assertions(2);
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const observable = relayEnvironment
      .getRelayEnvironment()
      .getNetwork()
      .execute(
        {
          cacheID: '123',
          id: null,
          text: 'query { hello }',
          name: 'TestQuery',
          operationKind: 'mutation',
          metadata: {},
        },
        {},
        {
          metadata: {
            useOfflineCache: true,
          },
        },
      );

    observable.subscribe({
      error: (error: any) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Mutation should not be cached');
      },
    });

    await flushPromises();
  });

  test('should clear cache when user logout', async () => {
    jest.mocked(getAuthState).mockReturnValue({
      authenticated: true,
      //@ts-expect-error we don't care about the profileInfos for this test
      profileInfos: {
        userId: 'fake-user-id',
      },
    });
    const environment = relayEnvironment.getRelayEnvironment();

    const results: any[] = [];
    const doFetch = () => {
      environment
        .getNetwork()
        .execute(
          {
            id: '123',
            text: null,
            name: 'TestQuery',
            operationKind: 'query',
            metadata: {},
          },
          {},
          {
            metadata: {
              useOfflineCache: true,
            },
          },
        )
        .subscribe({
          next: response => {
            results.push(response);
          },
        });
    };

    mockFetch.mockResolvedValueOnce({
      data: { hello: 'world' },
    });
    doFetch();
    await flushPromises();
    jest.mocked(getAuthState).mockReturnValue({
      authenticated: false,
      profileInfos: null,
    });
    dispatchAuthState({ authenticated: false, profileInfos: null });
    mockFetch.mockResolvedValueOnce({
      data: { hello: 'all the world' },
    });
    doFetch();
    await flushPromises();

    // Test no cache after logout
    mockFetch.mockResolvedValueOnce({
      data: { hello: 'new world' },
    });
    doFetch();
    await flushPromises();

    expect(results).toEqual([
      { data: { hello: 'world' } },
      { data: { hello: 'all the world' } },
      { data: { hello: 'new world' } },
    ]);
  });
});
