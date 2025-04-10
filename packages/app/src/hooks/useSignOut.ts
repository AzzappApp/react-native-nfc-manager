import { useCallback } from 'react';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { useDeleteNotifications } from './useNotifications';

/**
 * Returns signout function.
 */
const useSignOut = () => {
  const deleteFcmToken = useDeleteNotifications();

  const onSignout = useCallback(async () => {
    try {
      deleteFcmToken();
    } finally {
      void dispatchGlobalEvent({ type: 'SIGN_OUT' });
    }
  }, [deleteFcmToken]);

  return onSignout;
};

export default useSignOut;
