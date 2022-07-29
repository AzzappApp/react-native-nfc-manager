import { useEffect, useRef, useState } from 'react';
import {
  iosReadGalleryPermission,
  iosRequestReadWriteGalleryPermission,
} from 'react-native-photo-gallery-api';

// TODO should we use react-native-permission
const usePhotoGalleryPermission = (onAuthorizationFailed: () => void) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const onAuthorizationFailedRef = useRef(onAuthorizationFailed);
  if (onAuthorizationFailed !== onAuthorizationFailedRef.current) {
    onAuthorizationFailedRef.current = onAuthorizationFailed;
  }

  useEffect(() => {
    let canceled = false;
    const fetchPermission = async () => {
      let permission = await iosReadGalleryPermission('readWrite');
      if (canceled) {
        return;
      }
      if (permission === 'granted' || permission === 'limited') {
        setPermissionGranted(true);
        return;
      }

      permission = await iosRequestReadWriteGalleryPermission();
      if (canceled) {
        return;
      }
      if (permission === 'granted' || permission === 'limited') {
        setPermissionGranted(true);
        return;
      }
      onAuthorizationFailedRef.current();
    };

    fetchPermission().catch(() => onAuthorizationFailedRef.current());
    return () => {
      canceled = true;
    };
  }, []);

  return permissionGranted;
};

export default usePhotoGalleryPermission;
