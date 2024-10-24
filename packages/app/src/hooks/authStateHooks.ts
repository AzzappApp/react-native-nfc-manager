import { isEqual } from 'lodash';
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
  const profileInfosStore = useMemo(() => {
    let profileInfos = getAuthState().profileInfos;
    return {
      get: () => profileInfos,
      subscribe: (onStoreChange: () => void) =>
        addAuthStateListener(() => {
          const newProfileInfos = getAuthState().profileInfos;
          if (!isEqual(newProfileInfos, profileInfos)) {
            profileInfos = newProfileInfos;
            onStoreChange();
          }
        }),
    };
  }, []);
  return useSyncExternalStore(
    profileInfosStore.subscribe,
    profileInfosStore.get,
  );
};
