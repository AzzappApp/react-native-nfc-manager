import { useCallback } from 'react';
import { useWebAPI } from '#PlatformEnvironment';
import { dispatchGlobalEvent } from '#helpers/globalEvents';

const logout = () => {
  void dispatchGlobalEvent({ type: 'SIGN_OUT' });
};

export const useLogout = () => {
  const webApi = useWebAPI();

  const fullLogout = useCallback(() => {
    void webApi.logout();
    logout();
  }, [webApi]);

  return fullLogout;
};
