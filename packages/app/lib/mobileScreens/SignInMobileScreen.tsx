import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import { useRouter, useWebAPI } from '../PlatformEnvironment';
import SignInScreen from '../screens/SignInScreen';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

const SignInMobileScreen = () => {
  const WebAPI = useWebAPI();
  const router = useRouter();
  const signin = async (params: SignInParams) => {
    const tokens = await WebAPI.signin(params);
    await setTokens(tokens);
    resetEnvironment();
    router.back();
  };
  return <SignInScreen signin={signin} />;
};

export default SignInMobileScreen;
