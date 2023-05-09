import { useRouter, useWebAPI } from '#PlatformEnvironment';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import SignUpScreen from '#screens/SignUpScreen';
import type { Route } from '#routes';
import type { SignUpParams } from '@azzapp/shared/WebAPI';

const SignUpMobileScreen = () => {
  const WebAPI = useWebAPI();

  const router = useRouter();
  const signup = async (params: SignUpParams) => {
    const tokens = await WebAPI.signup(params);
    await dispatchGlobalEvent({
      type: 'SIGN_UP',
      payload: { authTokens: tokens },
    });
    router.replace({ route: 'NEW_PROFILE' });
  };

  return <SignUpScreen signup={signup} />;
};

export default SignUpMobileScreen;

SignUpMobileScreen.getRoutesToPrefetch = (): Route[] => [
  { route: 'NEW_PROFILE' },
];

SignUpMobileScreen.options = {
  replaceAnimation: 'push',
};
