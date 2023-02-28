'use client';

import { useRouter, useWebAPI } from '@azzapp/app/PlatformEnvironment';
import SignUpScreen from '@azzapp/app/screens/SignUpScreen';
import type { SignUpParams } from '@azzapp/shared/WebAPI';

const SignUpPage = () => {
  const WebAPI = useWebAPI();
  const router = useRouter();
  const signup = async (params: SignUpParams) => {
    await WebAPI.signup(params);
    router.showModal({ route: 'ONBOARDING' });
  };

  return <SignUpScreen signup={signup} />;
};

export default SignUpPage;

export const dynamic = 'force-static';
