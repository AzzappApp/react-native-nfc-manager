import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Platform } from 'react-native';
import { openPhotoPicker, RESULTS } from 'react-native-permissions';
import type { PermissionStatus } from 'react-native-permissions';

type Options = {
  onSelectedMorePhotos?: () => void;
};

const useMediaLimitedSelectionAlert = (
  mediaPermission: PermissionStatus,
  options: Options = {},
) => {
  const intl = useIntl();
  const initialMediaPermission = useRef(mediaPermission);

  useEffect(() => {
    if (
      initialMediaPermission.current === RESULTS.LIMITED &&
      Platform.OS === 'ios'
    ) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: '"azzapp" Would Like to Access Your Photos',
          description: 'Title of the permission picker in image picker wizard',
        }),
        intl.formatMessage({
          defaultMessage:
            'This lets you add photos and videos to your posts and profile.',
          description:
            'Description of the permission picker in image picker wizard',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Select More Photos ...',
              description:
                'Button to open the permission picker in image picker wizard',
            }),
            onPress: () => {
              openPhotoPicker().then(() => {
                options.onSelectedMorePhotos?.();
              });
            },
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Keep current selection',
              description:
                'Button to keep the current selection in image picker wizard',
            }),
            onPress: () => {},
            isPreferred: true,
          },
        ],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intl]);
};

export default useMediaLimitedSelectionAlert;
