import { useCallback } from 'react';
import { signInRoutes } from '#mobileRoutes';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { useDeleteNotifications } from './useNotifications';

/**
 * Returns signout function.
 */
const useSignOut = () => {
  const router = useRouter();
  const deleteFcmToken = useDeleteNotifications();

  const onSignout = useCallback(async () => {
    router.replaceAll(signInRoutes);
    try {
      deleteFcmToken();
    } finally {
      void dispatchGlobalEvent({ type: 'SIGN_OUT' });
    }
  }, [deleteFcmToken, router]);

  return onSignout;
};

export default useSignOut;
