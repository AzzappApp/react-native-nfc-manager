import * as Sentry from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import Purchases from 'react-native-purchases';
import { addAuthStateListener, getAuthState } from '#helpers/authStore';

export const useRevenueCat = () => {
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    async function login() {
      try {
        const { profileInfos } = getAuthState();
        if (profileInfos) {
          if (lastUserId.current !== profileInfos.userId) {
            lastUserId.current = profileInfos.userId;
            await Purchases.logIn(profileInfos.userId);
          }
        } else if (lastUserId.current !== null) {
          lastUserId.current = null;
          const isAnonymous = await Purchases.isAnonymous();
          if (!isAnonymous) {
            await Purchases.logOut();
          }
        }
      } catch (error) {
        Sentry.captureException(error);
      }
    }

    login();
    const removeListener = addAuthStateListener(login);

    return removeListener;
  }, []);
};
