import { mainRoutes, newProfileRoute } from '#mobileRoutes';
import { useRouter, useWebAPI } from '#PlatformEnvironment';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import SignInScreen from '#screens/SignInScreen';
import type { NativeRouter } from '#components/NativeRouter';
import type { SignInParams } from '@azzapp/shared/WebAPI';

const SignInMobileScreen = () => {
  const WebAPI = useWebAPI();
  const nativeRouter = useRouter() as NativeRouter;
  const signin = async (params: SignInParams) => {
    const { token, refreshToken, profileId } = await WebAPI.signin(params);
    await dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: { authTokens: { token, refreshToken }, profileId },
    });

    if (profileId) {
      nativeRouter.replaceAll(mainRoutes);
    } else {
      nativeRouter.replaceAll(newProfileRoute);
    }
  };
  return <SignInScreen signin={signin} />;
};

export default SignInMobileScreen;

SignInMobileScreen.options = {
  replaceAnimation: 'push',
};
