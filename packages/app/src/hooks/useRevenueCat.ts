import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { commitLocalUpdate } from 'react-relay';
import { getAuthState } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import type { CustomerInfo } from 'react-native-purchases';

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

  useEffect(() => {
    const listenerRc = (customerInfo: CustomerInfo) => {
      commitLocalUpdate(getRelayEnvironment(), store => {
        const { profileInfos } = getAuthState(); //need to refrehs it inside the callback
        if (
          profileInfos?.webCardId &&
          customerInfo.entitlements.active?.multiuser?.isActive
        ) {
          store.get(profileInfos.webCardId)?.setValue(true, 'isPremium');
        }
      });
    };
    Purchases.addCustomerInfoUpdateListener(listenerRc);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listenerRc);
    };
  }, []);
};
