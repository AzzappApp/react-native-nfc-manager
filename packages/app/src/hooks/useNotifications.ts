import { getMessaging as messaging } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getUniqueId, getDeviceId } from 'react-native-device-info';
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import { useMutation, graphql, commitMutation } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import type { PermissionStatus } from 'react-native-permissions';
import type { Environment } from 'react-relay';
import type { MutationConfig, MutationParameters } from 'relay-runtime';

const mutationConfig = (
  env: Environment,
  config: MutationConfig<MutationParameters>,
) => {
  return commitMutation(env, {
    ...config,
    cacheConfig: {
      metadata: { eraseCache: false },
    },
  });
};

export const useNotificationsManager = () => {
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

  const [commit] = useMutation(
    graphql`
      mutation useNotificationsMutation($input: SaveFCMTokenInput!) {
        saveFCMToken(input: $input)
      }
    `,
    mutationConfig,
  );

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

  return {
    notificationAuthorized: status === 'granted' || status === 'limited',
    requestNotificationPermission,
  };
};

type DeeplinkCallbackType =
  | ((deepLink: string, extraData?: any) => void)
  | null;

type useNotificationsEventProp = {
  onDeepLinkInApp?: DeeplinkCallbackType;
  onDeepLinkOpenedApp?: DeeplinkCallbackType;
};

const useNotificationsEvent = ({
  onDeepLinkInApp,
  onDeepLinkOpenedApp,
}: useNotificationsEventProp) => {
  const handleDeepLink = useCallback(
    (
      deepLink: object | string,
      callback?: DeeplinkCallbackType,
      extraData?: any,
    ) => {
      if (typeof deepLink === 'string') {
        callback?.(
          deepLink,
          extraData && typeof extraData === 'string'
            ? JSON.parse(extraData)
            : extraData,
        );
      }
    },
    [],
  );

  const router = useRouter();
  useEffect(() => {
    //on opening the app in background
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage.data?.deepLink) {
        handleDeepLink(
          remoteMessage.data?.deepLink,
          onDeepLinkOpenedApp,
          remoteMessage.data?.extraData,
        );
      }
    });
    // this is call when the app is in quit mode (kill)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          if (remoteMessage.data?.deepLink) {
            handleDeepLink(
              remoteMessage.data?.deepLink,
              onDeepLinkOpenedApp,
              remoteMessage.data?.extraData,
            );
          }
        }
      });

    return unsubscribe;
  }, [handleDeepLink, onDeepLinkInApp, onDeepLinkOpenedApp, router]);

  useEffect(() => {
    //on opening the app in background
    const unsubscribe = messaging().onMessage(remoteMessage => {
      if (remoteMessage.data?.deepLink) {
        handleDeepLink(
          remoteMessage.data?.deepLink,
          onDeepLinkInApp,
          remoteMessage.data?.extraData,
        );
      }
    });

    return unsubscribe;
  }, [handleDeepLink, onDeepLinkInApp]);
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

export default useNotificationsEvent;
