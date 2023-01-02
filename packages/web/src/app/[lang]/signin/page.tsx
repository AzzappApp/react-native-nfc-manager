'use client';

import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignInScreen from '@azzapp/app/lib/screens/SignInScreen';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

const SignInPage = () => {
  const router = useRouter();
  const WebAPI = useWebAPI();
  const signin = (params: SignInParams) =>
    WebAPI.signin(params).then(() => {
      router.replace({ route: 'HOME' });
    });

  return <SignInScreen signin={signin} />;
};

export default SignInPage;

export const dynamic = 'force-static';
