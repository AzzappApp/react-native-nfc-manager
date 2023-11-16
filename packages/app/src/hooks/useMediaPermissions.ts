import { PERMISSIONS } from 'react-native-permissions';
import { usePermission } from './usePermissions';
import type { PermissionStatus } from 'react-native-permissions';

function useMediaPermission(): {
  mediaPermission: PermissionStatus;
  requestMediaPermission: () => void;
} {
  const { status, ask } = usePermission(PERMISSIONS.IOS.PHOTO_LIBRARY);

  return {
    mediaPermission: status ?? 'unavailable',
    requestMediaPermission: ask,
  };
}

export default useMediaPermission;
