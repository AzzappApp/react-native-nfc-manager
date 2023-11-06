import { toGlobalId } from 'graphql-relay';
import EncryptedStorage from 'react-native-encrypted-storage';
import { MMKV } from 'react-native-mmkv';
import ERRORS from '@azzapp/shared/errors';
import { clearRecentSearch } from '#screens/SearchScreen/useRecentSearch';
import { addGlobalEventListener } from './globalEvents';

/**
 * this module is used to manage the auth tokens and auth related state
 */

const ENCRYPTED_STORAGE_TOKENS_KEY = 'AZZAPP_AUTH';
const MMKVS_WEBCARD_ID = '@azzap/auth.webCardId';
const MMKVS_PROFILE_ROLE = '@azzap/auth.profileRole';
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
   * The current user web card id, null if authenticated but without profile created
   */
  webCardId: string | null;
  /**
   * The current user profile role, null if authenticated but without profile created
   */
  profileRole: string | null;
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
    async ({ payload: { authTokens: tokens, webCardId, profileRole } }) => {
      if (webCardId) {
        storage.set(MMKVS_WEBCARD_ID, toGlobalId('WebCard', webCardId));
      }
      if (profileRole) {
        storage.set(MMKVS_PROFILE_ROLE, profileRole);
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
    'WEBCARD_CHANGE',
    async ({ payload: { webCardId, profileRole } }) => {
      storage.set(MMKVS_WEBCARD_ID, webCardId);
      storage.set(MMKVS_PROFILE_ROLE, profileRole);
      emitAuthState();
    },
  );

  addGlobalEventListener(
    'PROFILE_ROLE_CHANGE',
    async ({ payload: { profileRole } }) => {
      storage.set(MMKVS_PROFILE_ROLE, profileRole);
      emitAuthState();
    },
  );

  addGlobalEventListener('SIGN_OUT', async () => {
    storage.delete(MMKVS_WEBCARD_ID);
    storage.delete(MMKVS_PROFILE_ROLE);
    clearRecentSearch();
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
      storage.delete(MMKVS_WEBCARD_ID);
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
  webCardId: storage.getString(MMKVS_WEBCARD_ID) ?? null,
  hasBeenSignedIn: storage.getBoolean(MMKVS_HAS_BEEN_SIGNED_IN) ?? false,
  profileRole: storage.getString(MMKVS_PROFILE_ROLE) ?? null,
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
