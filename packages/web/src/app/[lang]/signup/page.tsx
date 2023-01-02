'use client';

import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignUpScreen from '@azzapp/app/lib/screens/SignUpScreen';
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

const SingUpPage = () => {
  const WebAPI = useWebAPI();
  const router = useRouter();
  const signup = (params: SignUpParams) =>
    WebAPI.signup(params).then(() => {
      router.replace({ route: 'HOME' });
    });

  return <SignUpScreen signup={signup} />;
};

export default SingUpPage;

export const dynamic = 'force-static';
