import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import type { PermissionStatus } from 'react-native-permissions';

function useMediaPermission(): {
  mediaPermission: PermissionStatus;
  requestMediaPermission: () => void;
} {
  const [status, setStatus] = useState<PermissionStatus>('unavailable');

  const ask = useCallback(async () => {
    const result: MediaLibrary.PermissionResponse =
      await MediaLibrary.requestPermissionsAsync();
    setStatus(convertPermissionResponse(result));
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      const newStatus = await MediaLibrary.getPermissionsAsync();
      setStatus(convertPermissionResponse(newStatus));
    };
    checkStatus();
  }, []);

  return {
    mediaPermission: status ?? 'unavailable',
    requestMediaPermission: ask,
  };
}

function convertPermissionResponse(
  response: MediaLibrary.PermissionResponse,
): PermissionStatus {
  const { status } = response;
  switch (status) {
    case 'granted':
      return 'granted';
    case 'undetermined':
      return 'denied';
    case 'denied':
      if (response.canAskAgain) {
        return 'denied';
      }
      return 'blocked';
  }
  return 'unavailable';
}

export default useMediaPermission;
