import { addEventListener, configure } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import env from '#env';
import type { NetInfoSubscription } from '@react-native-community/netinfo';
import type { AppStateStatus } from 'react-native';

const NetworkAvailableContext = createContext<boolean | null>(null);

export type NetworkAvailableContextProviderProps = {
  value: boolean;
  children: React.ReactNode;
};

export const NetworkAvailableContextProvider = ({
  value,
  children,
}: NetworkAvailableContextProviderProps) => {
  return (
    <NetworkAvailableContext.Provider value={value}>
      {children}
    </NetworkAvailableContext.Provider>
  );
};

// Will fetch availabilityCheck endpoint every 5s (reduce for DEV, to avoid to much log in webserver, specially when you are debugging the app))
const networkCheckTimeoutMs = __DEV__ ? 600000 : 5000;

// The url to request
const reachabilityUrl = `${env.NEXT_PUBLIC_API_ENDPOINT}/availabilityCheck`;

// configure NetInfo, should be done only once
configure({
  reachabilityUrl, // same as default
  reachabilityMethod: 'HEAD', // same as default
  reachabilityHeaders: {}, // same as default
  reachabilityTest: async response => response.status === 200,
  reachabilityLongTimeout: 60 * 1000, // default is 60s
  reachabilityShortTimeout: 5 * 1000, // default is 5s
  reachabilityRequestTimeout: 15 * 1000, // default is 15s
  reachabilityShouldRun: () => false, // same as default // disabled as we handle fetches on our side
  shouldFetchWiFiSSID: false, // default is false
  useNativeReachability: true, // default is true
});

export const useNetworkAvailableFetcher = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const connectionState = useRef({
    // Used to connectivity on device.
    // Listening this value allows a very fast reaction when user lost its networking "physically"
    networkConnected: true,
    // sed to track backend availability, needed to ensure backend is really up and running
    backendReachable: true,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const enableBackendFetcher = () => {
    if (intervalRef.current) {
      // already ongoing
      return;
    }
    // The function to query backend availability
    const fetchRequest = () => {
      fetch(reachabilityUrl, {
        method: 'HEAD',
        headers: {
          'x-vercel-protection-bypass':
            env.AZZAPP_API_VERCEL_PROTECTION_BYPASS ?? '',
        },
      })
        .then(() => {
          connectionState.current = {
            networkConnected: connectionState.current.networkConnected,
            backendReachable: true,
          };
          setIsConnected(
            connectionState.current.networkConnected &&
              connectionState.current.backendReachable,
          );
        })
        .catch(() => {
          connectionState.current = {
            networkConnected: connectionState.current.networkConnected,
            backendReachable: false,
          };
          setIsConnected(
            connectionState.current.networkConnected &&
              connectionState.current.backendReachable,
          );
        });
    };
    // initial check
    fetchRequest();
    // Handle backend availability refresh
    intervalRef.current = setInterval(fetchRequest, networkCheckTimeoutMs);
  };

  const disableBackendFetcher = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
  };

  ///// Device monitoring management
  const deviceMonitoringUnsubscribeRef = useRef<NetInfoSubscription>(undefined);

  const enableDeviceMonitoring = () => {
    if (!deviceMonitoringUnsubscribeRef.current) {
      // Handle device connection
      deviceMonitoringUnsubscribeRef.current = addEventListener(state => {
        if (state.isConnected !== null) {
          connectionState.current = {
            networkConnected: state.isConnected,
            backendReachable: connectionState.current.backendReachable,
          };
          setIsConnected(
            connectionState.current.networkConnected &&
              connectionState.current.backendReachable,
          );
        }
      });
    }
  };
  const disableDeviceMonitoring = () => {
    deviceMonitoringUnsubscribeRef.current?.();
    deviceMonitoringUnsubscribeRef.current = undefined;
  };

  useEffect(() => {
    function onChange(newState: AppStateStatus) {
      if (newState === 'active') {
        // enable all timers and monitoring
        enableDeviceMonitoring();
        enableBackendFetcher();
      } else {
        // cancel all timers and monitoring
        disableDeviceMonitoring();
        disableBackendFetcher();
      }
    }
    const subscription = AppState.addEventListener('change', onChange);
    // ensure initial state is well handled
    onChange(AppState.currentState);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      disableDeviceMonitoring();
      disableBackendFetcher();
    };
  }, []);

  return isConnected;
};

export const useNetworkAvailableContext = () => {
  const context = useContext(NetworkAvailableContext);
  if (context === null) {
    throw new Error('Using NetworkAvailableContext without provider');
  }

  return context;
};

export default NetworkAvailableContextProvider;
