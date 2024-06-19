import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import type { PermissionStatus } from 'react-native-permissions';

function useMediaPermission(): {
  mediaPermission: PermissionStatus;
  requestMediaPermission: () => void;
} {
  const [status, setStatus] = useState<PermissionStatus>('unavailable');

  const ask = useCallback(async () => {
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      const statuses = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ]);

      const photoPermission = convertPermissionResponse(
        statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES],
      );
      const videoPermission = convertPermissionResponse(
        statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO],
      );

      setStatus(
        photoPermission === 'blocked' || videoPermission === 'blocked'
          ? 'blocked'
          : photoPermission === 'granted' && videoPermission === 'granted'
            ? 'granted'
            : 'denied',
      );
    } else {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );

      setStatus(convertPermissionResponse(status));
    }
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
        const [hasReadMediaImagesPermission, hasReadMediaVideoPermission] =
          await Promise.all([
            PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            ),
            PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ),
          ]);
        return hasReadMediaImagesPermission && hasReadMediaVideoPermission;
      } else {
        return PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
      }
    };

    checkStatus().then(hasPermission =>
      setStatus(hasPermission ? 'granted' : 'denied'),
    );
  }, []);

  return {
    mediaPermission: status ?? 'unavailable',
    requestMediaPermission: ask,
  };
}

function convertPermissionResponse(
  status: 'denied' | 'granted' | 'never_ask_again',
): PermissionStatus {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'never_ask_again':
      return 'blocked';
    case 'denied':
      return 'denied';
  }
  return 'unavailable';
}

export default useMediaPermission;
