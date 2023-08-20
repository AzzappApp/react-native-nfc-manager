import { toGlobalId } from 'graphql-relay';
import EncryptedStorage from 'react-native-encrypted-storage';
import { MMKV } from 'react-native-mmkv';
import ERRORS from '@azzapp/shared/errors';
import { addGlobalEventListener } from './globalEvents';

/**
 * this module is used to manage the auth tokens and auth related state
 */

const ENCRYPTED_STORAGE_TOKENS_KEY = 'AZZAPP_AUTH';
const MMKVS_PROFILE_ID = '@azzap/auth.profileId';
const MMKVS_HAS_BEEN_SIGNED_IN = '@azzap/auth.hasBeenSignedIn';

/**
 * Auth state
 */
export type AuthState = {
  /**
   * if the user is authenticated
   */
  authenticated: boolean;
  /**
   * The current user profile id, null if authenticated but without profile created
   */
  profileId: string | null;
  /**
   * Has the user been signed in at least once
   */
  hasBeenSignedIn: boolean;
};

let authTokens: { token: string; refreshToken: string } | null = null;

const storage = new MMKV();

const authStateListener = new Set<(state: AuthState) => void>();

/**
 * Init the store
 */
export const init = async () => {
  authTokens = await EncryptedStorage.getItem(ENCRYPTED_STORAGE_TOKENS_KEY)
    .then(value => (value ? JSON.parse(value) : null))
    .catch(() => null);

  addGlobalEventListener(
    'SIGN_UP',
    async ({ payload: { authTokens: tokens } }) => {
      storage.set(MMKVS_HAS_BEEN_SIGNED_IN, true);
      await EncryptedStorage.setItem(
        ENCRYPTED_STORAGE_TOKENS_KEY,
        JSON.stringify(tokens),
      );
      authTokens = tokens;
      emitAuthState();
    },
  );

  addGlobalEventListener(
    'SIGN_IN',
    async ({ payload: { authTokens: tokens, profileId } }) => {
      if (profileId) {
        storage.set(MMKVS_PROFILE_ID, toGlobalId('Profile', profileId));
      }
      storage.set(MMKVS_HAS_BEEN_SIGNED_IN, true);
      await EncryptedStorage.setItem(
        ENCRYPTED_STORAGE_TOKENS_KEY,
        JSON.stringify(tokens),
      );
      authTokens = tokens;
      emitAuthState();
    },
  );

  addGlobalEventListener(
    'PROFILE_CHANGE',
    async ({ payload: { profileId } }) => {
      storage.set(MMKVS_PROFILE_ID, profileId);
      emitAuthState();
    },
  );

  addGlobalEventListener('SIGN_OUT', async () => {
    storage.delete(MMKVS_PROFILE_ID);
    await EncryptedStorage.clear();
    authTokens = null;
    emitAuthState();
  });

  addGlobalEventListener(
    'TOKENS_REFRESHED',
    async ({ payload: { authTokens: tokens } }) => {
      await EncryptedStorage.setItem(
        ENCRYPTED_STORAGE_TOKENS_KEY,
        JSON.stringify(tokens),
      );
      authTokens = tokens;
    },
  );

  addGlobalEventListener('NETWORK_ERROR', async ({ payload: { error } }) => {
    if (error instanceof Error && error.message === ERRORS.INVALID_TOKEN) {
      storage.delete(MMKVS_PROFILE_ID);
      await EncryptedStorage.removeItem(ENCRYPTED_STORAGE_TOKENS_KEY);
      authTokens = null;
      emitAuthState();
    }
  });
};

/**
 * Return the current auth state
 */
export const getAuthState = (): AuthState => ({
  authenticated: authTokens !== null,
  profileId: storage.getString(MMKVS_PROFILE_ID) ?? null,
  hasBeenSignedIn: storage.getBoolean(MMKVS_HAS_BEEN_SIGNED_IN) ?? false,
});

/**
 * Add a listener to the auth state
 * @param listener
 * @returns
 */
export const addAuthStateListener = (listener: (state: AuthState) => void) => {
  authStateListener.add(listener);
  return () => {
    authStateListener.delete(listener);
  };
};

const emitAuthState = () => {
  const state = getAuthState();
  for (const listener of authStateListener.values()) {
    listener(state);
  }
};

/**
 * Retrieve the auth tokens
 * @returns the tokens if exist
 */
export const getTokens = () => authTokens;

/**
 * Return true if the user has been signed in at least once
 */
export const hasBeenSignedIn = () =>
  storage.getBoolean(MMKVS_HAS_BEEN_SIGNED_IN);
