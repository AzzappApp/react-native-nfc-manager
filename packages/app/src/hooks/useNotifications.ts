import * as messaging from '@react-native-firebase/messaging';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getUniqueId, getDeviceId, getModel } from 'react-native-device-info';
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import { useMutation, graphql, commitMutation } from 'react-relay';
import { isSupportedNotificationData } from '@azzapp/shared/notificationHelpers';
import { useRouter } from '#components/NativeRouter';
import type { PushNotificationData } from '@azzapp/shared/notificationHelpers';
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
              deviceType: getModel() ?? 'unknown',
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
      messaging.getToken(messaging.getMessaging()).then(token => {
        return saveTokenToDatabase(token);
      });
      // Listen to whether the token changes
      return messaging.onTokenRefresh(messaging.getMessaging(), token => {
        saveTokenToDatabase(token);
      });
    }
  }, [saveTokenToDatabase, status]);

  return {
    notificationAuthorized: status === 'granted' || status === 'limited',
    requestNotificationPermission,
  };
};

type DeepLinkCallbackType =
  | ((notification: PushNotificationData) => void)
  | null;

type useNotificationsEventProp = {
  onDeepLinkInApp?: DeepLinkCallbackType;
  onDeepLinkOpenedApp?: DeepLinkCallbackType;
};

const useNotificationsEvent = ({
  onDeepLinkInApp,
  onDeepLinkOpenedApp,
}: useNotificationsEventProp) => {
  const router = useRouter();
  useEffect(() => {
    //on opening the app in background
    const unsubscribe = messaging.onNotificationOpenedApp(
      messaging.getMessaging(),
      remoteMessage => {
        if (isSupportedNotificationData(remoteMessage.data)) {
          onDeepLinkOpenedApp?.(remoteMessage.data);
        }
      },
    );
    // this is call when the app is in quit mode (kill)
    messaging
      .getInitialNotification(messaging.getMessaging())
      .then(remoteMessage => {
        if (remoteMessage) {
          if (isSupportedNotificationData(remoteMessage.data)) {
            onDeepLinkOpenedApp?.(remoteMessage.data);
          }
        }
      });

    return unsubscribe;
  }, [onDeepLinkInApp, onDeepLinkOpenedApp, router]);

  useEffect(() => {
    //on opening the app in background
    const unsubscribe = messaging.onMessage(
      messaging.getMessaging(),
      remoteMessage => {
        if (isSupportedNotificationData(remoteMessage.data)) {
          onDeepLinkInApp?.(remoteMessage.data);
        }
      },
    );

    return unsubscribe;
  }, [onDeepLinkInApp]);
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
