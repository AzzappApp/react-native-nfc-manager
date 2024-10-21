import {
  requestPermissionsAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useIntl } from 'react-intl';
import { Alert, Linking, Platform } from 'react-native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

/*
 * hook definition
 */
export const usePhonebookPermission = () => {
  const intl = useIntl();

  const displaySettingsRedirectPopup = () => {
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
          onPress: Linking.openSettings,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  /*
   * common function with or without redirection
   */
  const requestPhonebook = async (redirectToSettings: boolean) => {
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
          if (redirectToSettings) {
            displaySettingsRedirectPopup();
          }
          return { status: ContactPermissionStatus.DENIED };
        }
      }
    } else {
      // android
      const { status, canAskAgain } = await requestPermissionsAsync();
      if (status === ContactPermissionStatus.GRANTED) {
        return { status };
      }
      if (!canAskAgain && redirectToSettings) {
        displaySettingsRedirectPopup();
      }
      return { status: ContactPermissionStatus.DENIED };
    }
  };

  /*
   * request phonebook permission. In case of failure redirect to settings
   */
  const requestPhonebookPermissionAndRedirectToSettingsAsync = async () => {
    return requestPhonebook(true);
  };

  /*
   * request phonebook permission.
   */
  const requestPhonebookPermissionAsync = async () => {
    return requestPhonebook(false);
  };

  return {
    requestPhonebookPermissionAndRedirectToSettingsAsync,
    requestPhonebookPermissionAsync,
  };
};
