import {
  requestPermissionsAsync,
  getPermissionsAsync,
} from 'expo-media-library';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Linking } from 'react-native';
import type { PermissionInfo } from 'expo-permissions';
let permission: PermissionInfo;

let initialized = false;
const listeners: Array<() => void> = [];

const init = async () => {
  initialized = true;
  await getMediaLibraryPermissions();
  let appState = AppState.currentState;
  AppState.addEventListener('change', nextAppState => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      void getMediaLibraryPermissions();
    }
    appState = nextAppState;
  });
};

const dispatchChanges = () => {
  listeners.forEach(listener => listener());
};

const getMediaLibraryPermissions = async () => {
  permission = await getPermissionsAsync();
  dispatchChanges();
};

/**
 * requests the media libfary permission, if the permission is denied, it opens the settings.
 *
 * @returns a promise that resolves to the media library permission status.
 */
export const requestMediaLibraryPermission = async () => {
  if (permission != null && !permission?.canAskAgain) {
    void Linking.openSettings();
  } else {
    permission = await requestPermissionsAsync();
  }

  dispatchChanges();
  return permission.granted;
};

/**
 * A hook that returns the media library permissions.
 *
 * @returns The camera permissions.
 */
const useMediaLibraryPermission = () => {
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
    () => permission,
  );
};

export default useMediaLibraryPermission;
