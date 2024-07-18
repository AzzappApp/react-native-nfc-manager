import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { commitLocalUpdate } from 'react-relay';
import { getAuthState } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import useAuthState from '#hooks/useAuthState';
import type { CustomerInfo } from 'react-native-purchases';

export const useRevenueCat = () => {
  const { profileInfos } = useAuthState();

  useEffect(() => {
    async function login() {
      try {
        await Purchases.logIn(profileInfos!.userId);
      } catch (error) {
        Sentry.captureException(error);
      }
    }
    if (profileInfos?.userId) {
      login();
    }
    return () => {
      Purchases.logOut();
    };
  }, [profileInfos, profileInfos?.userId]);

  useEffect(() => {
    const listenerRc = (customerInfo: CustomerInfo) => {
      commitLocalUpdate(getRelayEnvironment(), store => {
        const { profileInfos } = getAuthState(); //need to refrehs it inside the callback
        if (
          profileInfos &&
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
