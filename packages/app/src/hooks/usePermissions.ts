import * as MediaLibrary from 'expo-media-library';
import { useState, useCallback, useEffect } from 'react';

import { Linking } from 'react-native';
import type { PermissionInfo } from 'expo-permissions';
/**
 * ask for medial library permission
 *
 * @export
 * @returns {[boolean, () => void]} true if granted, method to ask or open settings
 */

export function usePermissionMediaLibrary(): [boolean, boolean, () => void] {
  const [permission, setPermission] = useState<PermissionInfo>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permission) {
      MediaLibrary.getPermissionsAsync()
        .then(response => {
          setPermission(response);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [permission]);

  const ask = useCallback(async () => {
    if (permission != null && !permission?.canAskAgain) {
      void Linking.openSettings();
    } else {
      const response = await MediaLibrary.requestPermissionsAsync();
      setPermission(response);
    }
  }, [permission]);

  return [loading, permission?.granted ?? false, ask];
}
