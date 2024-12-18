import { addEventListener, configure } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

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

// Will fetch availabilityCheck endpoint every 5s
const networkCheckTimeoutMs = 5000;

// The url to request
const reachabilityUrl = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/availabilityCheck`;

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

  useEffect(() => {
    // The function to query backend availability
    const fetchRequest = () => {
      fetch(reachabilityUrl, {
        method: 'HEAD',
        headers: {
          'x-vercel-protection-bypass':
            process.env.AZZAPP_API_VERCEL_PROTECTION_BYPASS ?? '',
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
    const interval = setInterval(fetchRequest, networkCheckTimeoutMs);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Handle device connection
    const unsubscribe = addEventListener(state => {
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
    return () => {
      unsubscribe();
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
