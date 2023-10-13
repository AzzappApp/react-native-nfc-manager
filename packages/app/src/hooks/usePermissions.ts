import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import {
  request,
  requestMultiple,
  checkMultiple,
  check,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import type { Permission, PermissionStatus } from 'react-native-permissions';

const storagePermission = new MMKV();

export function useMediaPermission(): {
  mediaPermission: PermissionStatus | undefined;
  askMediaPermission: () => void;
} {
  const { status, ask } = usePermission(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : [
          PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
          PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
          PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
          PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION,
        ],
  );

  return {
    mediaPermission: status,
    askMediaPermission: ask,
  };
}

export function useCameraPermission(): {
  cameraPermission: PermissionStatus;
  askCameraPermission: () => Promise<void>;
} {
  const { status, ask } = usePermission(
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
  );

  return {
    cameraPermission: status,
    askCameraPermission: ask,
  };
}

export function useAudioPermission(): {
  audioPermission: PermissionStatus;
  askAudioPermission: () => Promise<void>;
} {
  const { status, ask } = usePermission(PERMISSIONS.IOS.MICROPHONE);

  return {
    audioPermission: Platform.OS === 'ios' ? status : RESULTS.GRANTED,
    askAudioPermission: ask,
  };
}

type PermissionHookResult = {
  status: PermissionStatus;
  ask: () => Promise<void>;
};

const usePermission = (
  permission: Permission | Permission[],
): PermissionHookResult => {
  const [status, setStatus] = useState<PermissionStatus>('unavailable');
  const mmkvKey = useMemo(
    () =>
      typeof permission === 'object'
        ? `permission.${permission.join('-')}`
        : `permission.${permission}`,
    [permission],
  );

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
  }, [mmkvKey, permission]);

  useEffect(() => {
    storagePermission.set(`permission.${mmkvKey}`, status);
  }, [mmkvKey, status]);

  useEffect(() => {
    const listener = storagePermission.addOnValueChangedListener(changedKey => {
      if (changedKey === mmkvKey) {
        const newValue = storagePermission.getString(mmkvKey);
        if (newValue !== 'unavailable') {
          setStatus(newValue as PermissionStatus);
        }
      }
    });
    return () => listener.remove();
  }, [mmkvKey]);

  return { status, ask };
};
