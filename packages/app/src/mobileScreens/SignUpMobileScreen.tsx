import { useEffect } from 'react';
import { useRelayEnvironment } from 'react-relay';
import { useRouter, useWebAPI } from '#PlatformEnvironment';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import SignUpScreen from '#screens/SignUpScreen';
import { preload as preloadNewProfile } from './NewProfileMobileScreen';
import type { SignUpParams } from '@azzapp/shared/WebAPI';

const SignUpMobileScreen = () => {
  const WebAPI = useWebAPI();

  const router = useRouter();
  const signup = async (params: SignUpParams) => {
    const tokens = await WebAPI.signup(params);
    dispatchGlobalEvent({
      type: 'SIGN_UP',
      payload: { authTokens: tokens },
    });
    router.replace({ route: 'NEW_PROFILE' });
  };

  const environment = useRelayEnvironment();
  useEffect(() => {
    void preloadNewProfile(environment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SignUpScreen signup={signup} />;
};

export default SignUpMobileScreen;

SignUpMobileScreen.options = {
  replaceAnimation: 'push',
};
