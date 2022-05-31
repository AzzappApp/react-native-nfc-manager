import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignUpScreen from '@azzapp/app/lib/SignUpScreen';
import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

const SignUpMobileScreen = () => {
  const WebAPI = useWebAPI();
  const router = useRouter();
  const signup = async (params: SignUpParams) => {
    const tokens = await WebAPI.signup(params);
    await setTokens(tokens);
    resetEnvironment();
    router.back();
  };
  return <SignUpScreen signup={signup} />;
};

export default SignUpMobileScreen;
