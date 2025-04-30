import isEqual from 'lodash/isEqual';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { addAuthStateListener, getAuthState } from '#helpers/authStore';

export const useIsAuthenticated = () => {
  const authenticatedSelector = useCallback(
    () => getAuthState().authenticated,
    [],
  );
  return useSyncExternalStore(addAuthStateListener, authenticatedSelector);
};

export const useProfileInfos = () => {
  const profileInfosStore = useMemo(() => createProfileInfosStore(), []);
  return useSyncExternalStore(
    profileInfosStore.subscribe,
    profileInfosStore.get,
  );
};

const createProfileInfosStore = () => {
  let profileInfos = getAuthState().profileInfos;
  return {
    get: () => profileInfos,
    subscribe: (onStoreChange: () => void) =>
      addAuthStateListener(newState => {
        const newProfileInfos = newState.profileInfos;
        if (!isEqual(newProfileInfos, profileInfos)) {
          profileInfos = newProfileInfos;
          onStoreChange();
        }
      }),
  };
};
