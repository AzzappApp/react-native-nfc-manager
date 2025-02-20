import {
  requestPermissionsAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Linking, Platform } from 'react-native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { waitForAppState } from '#helpers/appState';

/*
 * hook definition
 */
export const usePhonebookPermission = () => {
  const intl = useIntl();

  const displaySettingsRedirectPopup =
    useCallback(async (): Promise<ContactPermissionStatus> => {
      return new Promise(resolve => {
        Alert.alert(
          intl.formatMessage({
            defaultMessage: 'Cannot access to contacts',
            description: 'Alert title when contacts cannot be accessed',
          }),
          intl.formatMessage({
            defaultMessage:
              'Open your settings to share contacts access with azzapp and retry',
            description: 'Alert message when contacts cannot be accessed',
          }),
          [
            {
              text: 'Open settings',
              onPress: async () => {
                Linking.openSettings();
                // openSettings is not instant function due to android architecture.
                // So we cannot wait for the app being active directly after opening the settings,
                // because the app may still be active if the settings are not yet open.
                // Here I ensure setting are well open before waiting for app active
                await waitForAppState('background');
                await waitForAppState('active');
                const { status } = await requestPermissionsAsync();
                resolve(status);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                resolve(ContactPermissionStatus.DENIED);
              },
            },
          ],
          {
            cancelable: true,
            onDismiss: () => {
              resolve(ContactPermissionStatus.DENIED);
            },
          },
        );
      });
    }, [intl]);

  /*
   * common function with or without redirection
   */
  const requestPhonebook = useCallback(
    async (redirectToSettings: boolean) => {
      if (Platform.OS === 'ios') {
        // ios
        const result = await check(PERMISSIONS.IOS.CONTACTS);
        switch (result) {
          case RESULTS.LIMITED:
          case RESULTS.GRANTED:
            return { status: ContactPermissionStatus.GRANTED };
          case RESULTS.UNAVAILABLE:
          case RESULTS.DENIED: {
            const { status } = await requestPermissionsAsync();
            return { status };
          }
          case RESULTS.BLOCKED: {
            const status = redirectToSettings
              ? await displaySettingsRedirectPopup()
              : ContactPermissionStatus.DENIED;
            return { status };
          }
        }
      } else {
        // android
        const { status, canAskAgain } = await requestPermissionsAsync();
        if (status === ContactPermissionStatus.GRANTED) {
          return { status };
        }
        if (!canAskAgain && redirectToSettings) {
          return { status: await displaySettingsRedirectPopup() };
        }
        return { status: ContactPermissionStatus.DENIED };
      }
    },
    [displaySettingsRedirectPopup],
  );

  /*
   * request phonebook permission. In case of failure redirect to settings
   */
  const requestPhonebookPermissionAndRedirectToSettingsAsync =
    useCallback(async () => {
      return requestPhonebook(true);
    }, [requestPhonebook]);

  /*
   * request phonebook permission.
   */
  const requestPhonebookPermissionAsync = useCallback(async () => {
    return requestPhonebook(false);
  }, [requestPhonebook]);

  return {
    requestPhonebookPermissionAndRedirectToSettingsAsync,
    requestPhonebookPermissionAsync,
  };
};
