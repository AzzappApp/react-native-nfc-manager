'use client';

import { useWebAPI } from '@azzapp/app/PlatformEnvironment';
import SignInScreen from '@azzapp/app/screens/SignInScreen';
import type { SignInParams } from '@azzapp/shared/WebAPI';

const SignInWebScreen = () => {
  const WebAPI = useWebAPI();
  const signin = async (params: SignInParams) => {
    await WebAPI.signin(params);
  };

  return <SignInScreen signin={signin} />;
};

export default SignInWebScreen;
