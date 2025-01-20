import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import Purchases from 'react-native-purchases';

export const useRevenueCat = (userId: string | null | undefined) => {
  useEffect(() => {
    async function login(userId: string) {
      try {
        await Purchases.logIn(userId);
      } catch (error) {
        Sentry.captureException(error);
      }
    }
    if (userId) {
      login(userId);
    }
    return () => {
      Purchases.isAnonymous().then(isAnonymous => {
        if (!isAnonymous) {
          Purchases.logOut();
        }
      });
    };
  }, [userId]);
};
