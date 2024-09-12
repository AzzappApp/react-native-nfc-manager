import { createContext, useContext } from 'react';
import {
  useMediaPermission,
  useCameraPermission,
  useAudioPermission,
} from '#hooks/usePermissions';
import type { ReactNode } from 'react';
import type { PermissionStatus } from 'react-native-permissions';

type PermissionContextProps = {
  mediaPermission: PermissionStatus;
  requestMediaPermission: () => void;
  cameraPermission: PermissionStatus;
  requestCameraPermission: () => void;
  audioPermission: PermissionStatus;
  requestAudioPermission: () => void;
};

const PermissionContext = createContext<PermissionContextProps>({
  mediaPermission: 'unavailable',
  requestMediaPermission: async () => {},
  cameraPermission: 'unavailable',
  requestCameraPermission: async () => {},
  audioPermission: 'unavailable',
  requestAudioPermission: async () => {},
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { mediaPermission, requestMediaPermission } = useMediaPermission();
  const { cameraPermission, requestCameraPermission } = useCameraPermission();
  const { audioPermission, requestAudioPermission } = useAudioPermission();

  return (
    <PermissionContext.Provider
      value={{
        mediaPermission,
        requestMediaPermission,
        cameraPermission,
        requestCameraPermission,
        audioPermission,
        requestAudioPermission,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error(
      'usePermissionContext must be used within a PermissionProvider',
    );
  }
  return context;
}
