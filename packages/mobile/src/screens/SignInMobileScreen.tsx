import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignInScreen from '@azzapp/app/lib/SignInScreen';
import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
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
