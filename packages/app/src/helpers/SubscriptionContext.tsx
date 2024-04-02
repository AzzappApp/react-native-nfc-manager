import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { graphql, useMutation } from 'react-relay';
import { useAppState } from '#hooks/useAppState';
import useAuthState from '#hooks/useAuthState';
import { getActiveSubscription } from './MobileWebAPI';
import type { ReactNode } from 'react';
import type {
  CustomerInfo,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';

const SubscriptionContext = createContext<boolean>(false);

const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  //ignore while waiting full implementation and app account
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubscriber, setIsSubscriber] = useState(false);
  const { profileInfos } = useAuthState();

  const rcSubscription = useRef<PurchasesEntitlementInfo>();
  const relaySubscription = useRef<
    | {
        userId: string;
        subscriptionId: string;
        issuer: 'android' | 'ios' | 'web';
        startAt: Date;
        endAt: Date;
      }
    | null
    | undefined
  >();

  useEffect(() => {
    if (profileInfos?.userId) {
      if (Platform.OS === 'ios') {
        Purchases.configure({
          apiKey: process.env.PURCHASE_IOS_KEY!,
          appUserID: profileInfos.userId,
        });
      } else if (Platform.OS === 'android') {
        Purchases.configure({
          apiKey: process.env.PURCHASE_ANDROID_KEY!,
          appUserID: profileInfos.userId,
        });
      }
    }
  }, [profileInfos]);

  const [commit] = useMutation(graphql`
    mutation SubscriptionContextMutation(
      $userId: ID!
      $input: SaveSubscriptionInput!
    ) {
      saveSubscription(userId: $userId, input: $input) {
        userSubscription {
          subscriptionId
        }
      }
    }
  `);

  const mergeRelayRcResponses = useCallback(() => {
    const relay = relaySubscription.current;
    const rc = rcSubscription.current;
    if (rc && !relay) {
      //no relay can occurs when the user subscribe from the app and we did not fetch from the server yet(not realtime/push)
      //TODO: check if still required. we are doing a mutation because we don't have apple store account ready
      commit({
        variables: {
          userId: profileInfos?.userId,
          input: {
            subscriptionId: rc.productIdentifier,
            startAt: new Date(rc.latestPurchaseDateMillis),
            endAt: new Date(rc.expirationDateMillis!),
            issuer:
              rc.store === 'APP_STORE'
                ? 'apple'
                : rc.store === 'PLAY_STORE'
                  ? 'google'
                  : 'web',
          },
        },
      });

      const { isActive } = rc;
      setIsSubscriber(isActive);
    } else if (relay && !rc) {
      // it has to be web
      setIsSubscriber(relay.endAt.getTime() > Date.now());
    } else if (relay && rc) {
      //TODO; need the server notification (so an apple store account)to do real time to test the concept....
      setIsSubscriber(rc.isActive || relay.endAt.getTime() > Date.now());
    } else {
      setIsSubscriber(false);
    }
  }, [commit, profileInfos?.userId]);

  const appState = useAppState();

  useEffect(() => {
    if (appState === 'active') {
      getActiveSubscription().then(response => {
        relaySubscription.current = response.subscription;
        mergeRelayRcResponses();
      });
    }
  }, [appState, mergeRelayRcResponses]);

  useEffect(() => {
    // for immediate response  when IAP, we are gonna use RC listener.
    // Why => Apple/google send a notification server to RC, then a webhook called our api to update the userSubscription table
    // we don't have realtime, polling is not efficient enough from my personal opinion(and will do to much request)
    const listener = (customerInfo: CustomerInfo) => {
      rcSubscription.current = customerInfo.entitlements.active.multiUser;
      mergeRelayRcResponses();
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [mergeRelayRcResponses]);

  // force subscriber to true
  return (
    <SubscriptionContext.Provider value={true}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default memo(SubscriptionProvider);

export function useIsSubscriber() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscriptionContext must be used within a SubscriptionProvider',
    );
  }
  return context;
}
