import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import type { Permission, PermissionStatus } from 'react-native-permissions';

const storagePermission = new MMKV();

export function useMediaPermission(): {
  mediaPermission: PermissionStatus | undefined;
  askMediaPermission: () => void;
} {
  const { status, ask } = usePermission(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION,
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

const usePermission = (permission: Permission): PermissionHookResult => {
  const [status, setStatus] = useState<PermissionStatus>('unavailable');
  const ask = useCallback(async () => {
    const newStatus = await request(permission);
    setStatus(newStatus);
  }, [permission]);

  useEffect(() => {
    const checkStatus = async () => {
      const newStatus = await check(permission);
      setStatus(newStatus);
    };
    checkStatus();
  }, [permission]);

  useEffect(() => {
    storagePermission.set(`permission.${permission}`, status);
  }, [permission, status]);

  useEffect(() => {
    const listener = storagePermission.addOnValueChangedListener(changedKey => {
      if (changedKey === `permission.${permission}`) {
        const newValue = storagePermission.getString(
          `permission.${permission}`,
        );
        if (newValue !== 'unavailable') {
          setStatus(newValue as PermissionStatus);
        }
      }
    });
    return () => listener.remove();
  }, [permission]);

  return { status, ask };
};
