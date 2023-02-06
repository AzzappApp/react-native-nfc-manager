'use client';

import { useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignInScreen from '@azzapp/app/lib/screens/SignInScreen';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

const SignInPage = () => {
  const WebAPI = useWebAPI();
  const signin = async (params: SignInParams) => {
    await WebAPI.signin(params);
  };

  return <SignInScreen signin={signin} />;
};

export default SignInPage;

export const dynamic = 'force-static';
