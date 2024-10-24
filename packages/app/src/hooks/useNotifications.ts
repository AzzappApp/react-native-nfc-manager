import messaging from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getUniqueId, getDeviceId } from 'react-native-device-info';
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import { useMutation, graphql } from 'react-relay';
import type { PermissionStatus } from 'react-native-permissions';
const useNotifications = (onDeepLink?: ((deepLink: string) => void) | null) => {
  const [status, setStatus] = useState<PermissionStatus>('unavailable');

  useEffect(() => {
    const checkStatus = async () => {
      const res = await checkNotifications();
      setStatus(res.status);
    };
    checkStatus();
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    const res = await requestNotifications(['alert', 'sound', 'badge']);
    setStatus(res.status);
  }, []);

  const [commit] = useMutation(graphql`
    mutation useNotificationsMutation($input: SaveFCMTokenInput!) {
      saveFCMToken(input: $input)
    }
  `);

  const saveTokenToDatabase = useCallback(
    async (fcmToken: string) => {
      const deviceId = await getUniqueId();
      const deviceType = getDeviceId();
      if (fcmToken && deviceId && deviceType) {
        commit({
          variables: {
            input: {
              deviceId,
              deviceOS: Platform.OS === 'ios' ? 'ios' : 'android',
              deviceType: Device.modelId ?? Device.modelName ?? 'unknown',
              fcmToken,
            },
          },
        });
      }
    },
    [commit],
  );

  useEffect(() => {
    if (status === 'granted' || status === 'limited') {
      messaging()
        .getToken()
        .then(token => {
          return saveTokenToDatabase(token);
        });
      // Listen to whether the token changes
      return messaging().onTokenRefresh(token => {
        saveTokenToDatabase(token);
      });
    }
  }, [saveTokenToDatabase, status]);

  const handleDeepLink = useCallback(
    (deepLink: object | string) => {
      if (typeof deepLink === 'string') {
        onDeepLink?.(deepLink);
        if (deepLink === 'shareBack') {
          //TODO; find the correct route
        }
      }
    },
    [onDeepLink],
  );

  useEffect(() => {
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage.data?.deepLink) {
        handleDeepLink(remoteMessage.data?.deepLink);
      }
      // Handle the notification event here
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          if (remoteMessage.data?.deepLink) {
            handleDeepLink(remoteMessage.data?.deepLink);
          }
        }
      });

    return unsubscribe;
  }, [handleDeepLink]);

  return {
    notificationAuthorized: status === 'granted' || status === 'limited',
    requestNotificationPermission,
  };
};

export const useDeleteNotifications = () => {
  const [commit] = useMutation(graphql`
    mutation useNotificationsDeleteMutation($input: DeleteFCMTokenInput!) {
      deleteFCMToken(input: $input)
    }
  `);
  const deleteFcmToken = useCallback(async () => {
    const deviceId = await getUniqueId();
    commit({
      variables: {
        input: {
          deviceId,
        },
      },
    });
  }, [commit]);

  return deleteFcmToken;
};

export default useNotifications;
