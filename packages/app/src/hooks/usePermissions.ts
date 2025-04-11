import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  request,
  requestMultiple,
  checkMultiple,
  check,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import useMediaPermission from './useMediaPermissions';
import type { Permission, PermissionStatus } from 'react-native-permissions';

// TODO: keep this for futur usage when expo media will be compatible with new android permissions
// export function useMediaPermission(): {
//   mediaPermission: PermissionStatus;
//   requestMediaPermission: () => void;
// } {
//   const { status, ask } = usePermission(
//     Platform.OS === 'ios'
//       ? PERMISSIONS.IOS.PHOTO_LIBRARY
//       : [
//           PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
//           PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
//           PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
//           PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION,
//         ],
//   );

//   return {
//     mediaPermission: status ?? 'unavailable',
//     requestMediaPermission: ask,
//   };
// }

function useCameraPermission(): {
  cameraPermission: PermissionStatus;
  requestCameraPermission: () => Promise<void>;
} {
  const { status, ask } = usePermission(
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.CAMERA
      : PERMISSIONS.IOS.CAMERA,
  );

  return {
    cameraPermission: status ?? 'unavailable',
    requestCameraPermission: ask,
  };
}

function useAudioPermission(): {
  audioPermission: PermissionStatus;
  requestAudioPermission: () => Promise<void>;
} {
  const { status, ask } = usePermission(
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.RECORD_AUDIO
      : PERMISSIONS.IOS.MICROPHONE,
  );

  return {
    audioPermission: Platform.OS === 'ios' ? status : RESULTS.GRANTED,
    requestAudioPermission: ask,
  };
}

function useContactReadWritePermission(): {
  contactPermission: PermissionStatus;
  requestContactPermission: () => Promise<void>;
} {
  const { status, ask } = usePermission(
    Platform.OS === 'android'
      ? [PERMISSIONS.ANDROID.WRITE_CONTACTS, PERMISSIONS.ANDROID.READ_CONTACTS]
      : PERMISSIONS.IOS.CONTACTS,
  );
  return {
    contactPermission: status,
    requestContactPermission: ask,
  };
}

type PermissionHookResult = {
  status: PermissionStatus;
  ask: () => Promise<void>;
};

export const usePermission = (
  permission: Permission | Permission[],
): PermissionHookResult => {
  const [status, setStatus] = useState<PermissionStatus>('unavailable');

  const ask = useCallback(async () => {
    if (typeof permission === 'object') {
      const newStatus = await requestMultiple(permission);
      for (let index = 0; index < permission.length; index += 1) {
        const element = permission[index];
        if (newStatus[element] === 'blocked') {
          setStatus('blocked');
          return;
        } else if (newStatus[element] === 'denied') {
          setStatus('denied');
          return;
        } else if (newStatus[element] === 'granted') {
          setStatus('granted');
        }
      }
      return;
    } else {
      const newStatus = await request(permission);
      setStatus(newStatus);
    }
  }, [permission]);

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof permission === 'object') {
        const newStatus = await checkMultiple(permission);
        let definedStatus: PermissionStatus = 'unavailable';
        for (let index = 0; index < permission.length; index += 1) {
          const element = permission[index];
          if (newStatus[element] === 'blocked') {
            definedStatus = 'blocked';
            break;
          } else if (newStatus[element] === 'denied') {
            definedStatus = 'denied';
            break;
          } else if (newStatus[element] === 'granted') {
            definedStatus = 'granted';
          }
        }
        setStatus(definedStatus);
      } else {
        const newStatus = await check(permission);
        setStatus(newStatus);
      }
    };
    checkStatus();
  }, [permission]);

  return { status, ask };
};

export {
  useCameraPermission,
  useAudioPermission,
  useMediaPermission,
  useContactReadWritePermission,
};
