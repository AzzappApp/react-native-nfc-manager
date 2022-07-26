import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import { useRouter, useWebAPI } from '../PlatformEnvironment';
import SignUpScreen from '../SignUpScreen';
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
