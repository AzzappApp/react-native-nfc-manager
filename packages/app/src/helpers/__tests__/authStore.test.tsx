import EncryptedStorage from 'react-native-encrypted-storage';
import ERRORS from '@azzapp/shared/errors';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import * as AuthStore from '../authStore';

jest.mock('react-native-encrypted-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@azzapp/shared/getRuntimeEnvironment', () =>
  jest.fn().mockReturnValue('react-native'),
);

const mockMMKVValues = new Map<string, any>();
const mockMMKV = {
  set: jest.fn((key, value) => {
    mockMMKVValues.set(key, value);
  }),
  delete: jest.fn(key => mockMMKVValues.delete(key)),
  getString: jest.fn(key => mockMMKVValues.get(key)),
  getBoolean: jest.fn(key => mockMMKVValues.get(key)),
};

jest.mock('react-native-mmkv', () => {
  class MMKVMock {
    set(key: string, value: any) {
      mockMMKV.set(key, value);
    }
    delete(key: string) {
      mockMMKV.delete(key);
    }
    getString(key: string) {
      return mockMMKV.getString(key);
    }
    getBoolean(key: string) {
      return mockMMKV.getBoolean(key);
    }
  }
  return { MMKV: MMKVMock };
});

jest.useFakeTimers();
describe('AuthModule', () => {
  const testToken = { token: 'testToken', refreshToken: 'testRefreshToken' };
  const testProfileId = 'testProfileID';

  const authListener = jest.fn();
  const subscription = AuthStore.addAuthStateListener(authListener);

  afterEach(() => {
    jest.clearAllMocks();
    mockMMKVValues.clear();
  });

  afterAll(() => {
    subscription();
  });

  test('init() sets auth tokens correctly', () => {
    (EncryptedStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(testToken),
    );
    mockMMKV.getString.mockReturnValueOnce(testProfileId);
    mockMMKV.getBoolean.mockReturnValueOnce(true);
    void AuthStore.init();

    jest.runAllTicks();

    expect(EncryptedStorage.getItem).toHaveBeenCalledWith('AZZAPP_AUTH');
    expect(AuthStore.getTokens()).toEqual(testToken);
    expect(AuthStore.getAuthState()).toEqual({
      authenticated: true,
      hasBeenSignedIn: true,
      profileId: testProfileId,
    });
  });

  test('SIGN_UP events updates auth state correctly', () => {
    dispatchGlobalEvent({
      type: 'SIGN_UP',
      payload: {
        authTokens: testToken,
      },
    });
    jest.runAllTicks();

    expect(EncryptedStorage.setItem).toHaveBeenCalledWith(
      'AZZAPP_AUTH',
      JSON.stringify(testToken),
    );
    expect(AuthStore.getAuthState()).toEqual({
      authenticated: true,
      hasBeenSignedIn: true,
      profileId: null,
    });
    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());
    expect(authListener).toHaveBeenCalledTimes(1);
  });

  test('SIGN_IN events updates auth state correctly', () => {
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: testToken,
        profileId: testProfileId,
      },
    });
    jest.runAllTicks();
    expect(EncryptedStorage.setItem).toHaveBeenCalledWith(
      'AZZAPP_AUTH',
      JSON.stringify(testToken),
    );
    expect(AuthStore.getAuthState()).toEqual({
      authenticated: true,
      hasBeenSignedIn: true,
      profileId: testProfileId,
    });
    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());
    expect(authListener).toHaveBeenCalledTimes(1);
  });

  test('SIGN_OUT events updates auth state correctly', () => {
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: testToken,
        profileId: testProfileId,
      },
    });
    jest.runAllTicks();

    dispatchGlobalEvent({
      type: 'SIGN_OUT',
    });
    jest.runAllTicks();

    expect(EncryptedStorage.removeItem).toHaveBeenCalledWith('AZZAPP_AUTH');
    expect(AuthStore.getAuthState()).toEqual({
      authenticated: false,
      hasBeenSignedIn: true,
      profileId: null,
    });
    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());
    expect(authListener).toHaveBeenCalledTimes(2);
  });

  test('TOKENS_REFRESHED events updates auth state correctly', () => {
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: testToken,
        profileId: testProfileId,
      },
    });
    jest.runAllTicks();

    dispatchGlobalEvent({
      type: 'TOKENS_REFRESHED',
      payload: {
        authTokens: { token: 'testToken2', refreshToken: 'testRefreshToken2' },
      },
    });
    jest.runAllTicks();

    expect(EncryptedStorage.setItem).toHaveBeenCalledWith(
      'AZZAPP_AUTH',
      JSON.stringify(testToken),
    );
    expect(EncryptedStorage.setItem).toHaveBeenCalledWith(
      'AZZAPP_AUTH',
      JSON.stringify({
        token: 'testToken2',
        refreshToken: 'testRefreshToken2',
      }),
    );
    expect(AuthStore.getAuthState()).toEqual({
      authenticated: true,
      hasBeenSignedIn: true,
      profileId: testProfileId,
    });
    expect(AuthStore.getTokens()).toEqual({
      token: 'testToken2',
      refreshToken: 'testRefreshToken2',
    });
    expect(authListener).toHaveBeenCalledTimes(1);
  });

  test('PROFILE_CHANGE events updates auth state correctly', () => {
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: testToken,
        profileId: testProfileId,
      },
    });
    jest.runAllTicks();

    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());

    dispatchGlobalEvent({
      type: 'PROFILE_CHANGE',
      payload: {
        profileId: 'testProfileId2',
        authTokens: testToken,
      },
    });
    jest.runAllTicks();

    expect(AuthStore.getAuthState()).toEqual({
      authenticated: true,
      hasBeenSignedIn: true,
      profileId: 'testProfileId2',
    });
    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());
    expect(authListener).toHaveBeenCalledTimes(2);
  });

  test('NETWORK_ERROR events updates auth state correctly', () => {
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: testToken,
        profileId: testProfileId,
      },
    });
    jest.runAllTicks();

    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());

    dispatchGlobalEvent({
      type: 'NETWORK_ERROR',
      payload: {
        error: new Error('test'),
        params: {},
      },
    });
    jest.runAllTicks();

    expect(authListener).toHaveBeenCalledTimes(1);
    expect(AuthStore.getAuthState()).toEqual({
      authenticated: true,
      hasBeenSignedIn: true,
      profileId: testProfileId,
    });

    dispatchGlobalEvent({
      type: 'NETWORK_ERROR',
      payload: {
        error: new Error(ERRORS.INVALID_TOKEN),
        params: {},
      },
    });
    jest.runAllTicks();

    expect(AuthStore.getAuthState()).toEqual({
      authenticated: false,
      hasBeenSignedIn: true,
      profileId: null,
    });
    expect(authListener).toHaveBeenLastCalledWith(AuthStore.getAuthState());
    expect(authListener).toHaveBeenCalledTimes(2);
  });
});
