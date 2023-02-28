import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import type { CameraPermissionStatus } from 'react-native-vision-camera';

let permissions: {
  cameraPermission: CameraPermissionStatus;
  microphonePermission: CameraPermissionStatus;
} = {
  cameraPermission: 'not-determined',
  microphonePermission: 'not-determined',
};

let initialized = false;
const listeners: Array<() => void> = [];

const init = async () => {
  initialized = true;
  await getCameraPermissions();
  let appState = AppState.currentState;
  AppState.addEventListener('change', nextAppState => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      void getCameraPermissions();
    }
    appState = nextAppState;
  });
};

const dispatchChanges = () => {
  listeners.forEach(listener => listener());
};

const getCameraPermissions = async () => {
  let cameraPermission: CameraPermissionStatus;
  let microphonePermission: CameraPermissionStatus;
  try {
    cameraPermission = await Camera.getCameraPermissionStatus();
  } catch {
    cameraPermission = 'denied';
  }
  try {
    microphonePermission = await Camera.getMicrophonePermissionStatus();
  } catch {
    microphonePermission = 'denied';
  }
  permissions = { cameraPermission, microphonePermission };
  dispatchChanges();
};

export const requestCameraPermission = async () => {
  if (permissions.cameraPermission === 'denied') {
    await Linking.openSettings();
    return 'denied';
  }
  permissions = {
    ...permissions,
    cameraPermission: await Camera.requestCameraPermission(),
  };
  dispatchChanges();
  return permissions.cameraPermission;
};

export const requestMicrophonePermission = async () => {
  if (permissions.microphonePermission === 'denied') {
    await Linking.openSettings();
    return 'denied';
  }
  permissions = {
    ...permissions,
    microphonePermission: await Camera.requestMicrophonePermission(),
  };
  dispatchChanges();
  return permissions.microphonePermission;
};

const useCameraPermissions = () => {
  useEffect(() => {
    if (!initialized) {
      void init();
    }
  }, []);

  return useSyncExternalStore(
    onStoreChange => {
      listeners.push(onStoreChange);
      return () => {
        const index = listeners.indexOf(onStoreChange);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    },
    () => permissions,
  );
};

export default useCameraPermissions;
