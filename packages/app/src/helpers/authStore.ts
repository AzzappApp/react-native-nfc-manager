import _ from 'lodash';
import { startTransition } from 'react';
import { MMKV } from 'react-native-mmkv';
import ERRORS from '@azzapp/shared/errors';
import { clearRecentSearch } from '#screens/SearchScreen/useRecentSearch';
import { addGlobalEventListener } from './globalEvents';

/**
 * this module is used to manage the auth tokens and auth related state
 */

const ENCRYPTED_STORAGE_TOKENS_KEY = 'AZZAPP_AUTH';
const MMKVS_PROFILE_INFOS = '@azzap/auth.profileInfos';

export const encryptedStorage = new MMKV({
  id: `encrypted-storage`,
  encryptionKey: '@azzapp-encryption-key',
});

/**
 * The profile infos
 */
export type ProfileInfos = {
  /**
   * the current user id
   */
  userId: string;
  /**
   * the current user profile id
   */
  profileId: string | null;
  /**
   * the current user web card id
   */
  webCardId: string | null;
  /**
   * the current user profile role
   */
  profileRole: string | null;
  /**
   * the current user email
   */
  email: string | null;
  /**
   * the current user phoneNumber
   */
  phoneNumber: string | null;
  /**
   * The user is invited and has not yet accepted the invitation
   */
  invited: boolean;
  /**
   * The username of the webcard
   */
  webCardUserName?: string | null;

  cardIsPublished?: boolean;
  coverIsPredefined?: boolean;
};

export type ProfileInfosInput = Pick<
  ProfileInfos,
  | 'cardIsPublished'
  | 'coverIsPredefined'
  | 'invited'
  | 'profileId'
  | 'profileRole'
  | 'webCardId'
  | 'webCardUserName'
>;

/**
 * Auth state
 */
export type AuthState = {
  /**
   * if the user is authenticated
   */
  authenticated: boolean;
  /**
   * the current profile infos  null if authenticated but without profile created
   */
  profileInfos: ProfileInfos | null;
};

let authTokens: { token: string; refreshToken: string } | null = null;

const storage = new MMKV();

const authStateListener = new Set<(state: AuthState) => void>();

/**
 * Init the store
 */
export const init = async () => {
  const storedAuthToken = encryptedStorage.getString(
    ENCRYPTED_STORAGE_TOKENS_KEY,
  );

  authTokens = storedAuthToken ? JSON.parse(storedAuthToken) : null;

  addGlobalEventListener(
    'SIGN_UP',
    ({ payload: { authTokens: tokens, email, phoneNumber, userId } }) => {
      encryptedStorage.set(
        ENCRYPTED_STORAGE_TOKENS_KEY,
        JSON.stringify(tokens),
      );
      storage.set(
        MMKVS_PROFILE_INFOS,
        JSON.stringify({ email, phoneNumber, userId }),
      );
      authTokens = tokens;
    },
  );

  addGlobalEventListener(
    'SIGN_IN',
    ({
      payload: { authTokens: tokens, profileInfos, email, phoneNumber, userId },
    }) => {
      encryptedStorage.set(
        ENCRYPTED_STORAGE_TOKENS_KEY,
        JSON.stringify(tokens),
      );
      authTokens = tokens;
      if (profileInfos) {
        storage.set(
          MMKVS_PROFILE_INFOS,
          JSON.stringify({
            ...profileInfos,
            email,
            phoneNumber,
            userId,
          }),
        );
      } else {
        //with the email and phone number confirmation flow, SIGN_UP can be never called
        storage.set(
          MMKVS_PROFILE_INFOS,
          JSON.stringify({
            email,
            phoneNumber,
            userId,
          }),
        );
      }
    },
  );

  //@deprecated don't really see the point to listen in one place the event.
  // cause some discrepancy with the home (due to a small delay)
  //will wait to evg test to validate
  // addGlobalEventListener(
  //   'WEBCARD_CHANGE',
  //   async ({ payload: { profileId, webCardId, profileRole } }) => {
  //     const profileInfos = getAuthState().profileInfos;
  //     if (
  //       profileInfos == null ||
  //       (profileInfos && profileInfos.profileId !== profileId)
  //     ) {
  //       storage.set(
  //         MMKVS_PROFILE_INFOS,
  //         JSON.stringify({
  //           ...profileInfos,
  //           profileId,
  //           webCardId,
  //           profileRole,
  //         }),
  //       );
  //       emitAuthState();
  //     }
  //   },
  // );

  addGlobalEventListener(
    'PROFILE_ROLE_CHANGE',
    async ({ payload: { profileRole } }) => {
      const profileInfos = getAuthState().profileInfos;
      if (profileInfos) {
        storage.set(
          MMKVS_PROFILE_INFOS,
          JSON.stringify({ ...profileInfos, profileRole }),
        );
      }
    },
  );

  addGlobalEventListener('SIGN_OUT', async () => {
    authTokens = null;
    storage.delete(MMKVS_PROFILE_INFOS);
    clearRecentSearch();
    encryptedStorage.clearAll();
  });

  addGlobalEventListener(
    'TOKENS_REFRESHED',
    ({ payload: { authTokens: tokens } }) => {
      encryptedStorage.set(
        ENCRYPTED_STORAGE_TOKENS_KEY,
        JSON.stringify(tokens),
      );
      authTokens = tokens;
    },
  );

  addGlobalEventListener('NETWORK_ERROR', async ({ payload: { error } }) => {
    if (error instanceof Error && error.message === ERRORS.INVALID_TOKEN) {
      authTokens = null;
      storage.delete(MMKVS_PROFILE_INFOS);
      encryptedStorage.delete(ENCRYPTED_STORAGE_TOKENS_KEY);
    }
  });
};

/**
 * Return the current auth state
 */
export const getAuthState = (): AuthState => {
  const profileInfoString = storage.getString(MMKVS_PROFILE_INFOS);
  let profileInfos: any = null;
  try {
    profileInfos = profileInfoString ? JSON.parse(profileInfoString) : null;
  } catch {
    profileInfos = null;
  }

  return {
    authenticated: authTokens !== null,
    profileInfos: profileInfos ?? null,
  };
};

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

storage.addOnValueChangedListener(changedKey => {
  if (changedKey === MMKVS_PROFILE_INFOS) {
    emitAuthState();
  }
});

const emitAuthState = () => {
  const state = getAuthState();
  startTransition(() => {
    for (const listener of authStateListener.values()) {
      listener(state);
    }
  });
};

/**
 * Retrieve the auth tokens
 * @returns the tokens if exist
 */
export const getTokens = () => authTokens;

export const commonKeysAreEqual = (a: any, b: any) => {
  const commonKeys = _.intersection(_.keys(a), _.keys(b));

  const obj1Common = _.pick(a, commonKeys);
  const obj2Common = _.pick(b, commonKeys);

  return _.isEqual(obj1Common, obj2Common);
};

export const onChangeWebCard = async (
  infos?: Partial<ProfileInfosInput> | null,
) => {
  const newData = infos ?? {
    profileId: null,
    webCardId: null,
    profileRole: null,
    invited: false,
    webCardUserName: undefined,
    cardIsPublished: undefined,
    coverIsPredefined: undefined,
  };
  const profileInfos = getAuthState().profileInfos;

  if (!commonKeysAreEqual(profileInfos, newData)) {
    storage.set(
      MMKVS_PROFILE_INFOS,
      JSON.stringify({
        ...profileInfos,
        ...newData,
      }),
    );
  }
};
