import { createContext, useContext } from 'react';
import {
  useMediaPermission,
  useCameraPermission,
  useAudioPermission,
  useContactReadWritePermission,
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
  contactPermission: PermissionStatus;
  requestContactPermission: () => void;
};

const PermissionContext = createContext<PermissionContextProps>({
  mediaPermission: 'unavailable',
  requestMediaPermission: async () => {},
  cameraPermission: 'unavailable',
  requestCameraPermission: async () => {},
  audioPermission: 'unavailable',
  requestAudioPermission: async () => {},
  contactPermission: 'unavailable',
  requestContactPermission: async () => {},
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { mediaPermission, requestMediaPermission } = useMediaPermission();
  const { cameraPermission, requestCameraPermission } = useCameraPermission();
  const { audioPermission, requestAudioPermission } = useAudioPermission();
  const { contactPermission, requestContactPermission } =
    useContactReadWritePermission();

  return (
    <PermissionContext.Provider
      value={{
        mediaPermission,
        requestMediaPermission,
        cameraPermission,
        requestCameraPermission,
        audioPermission,
        requestAudioPermission,
        contactPermission,
        requestContactPermission,
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
