import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import { useWebAPI } from '../PlatformEnvironment';
import SignInMobileScreen from '../screens/SignInScreen';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

const SignUpMobileScreen = () => {
  const WebAPI = useWebAPI();
  const signin = async (params: SignInParams) => {
    const tokens = await WebAPI.signin(params);
    await setTokens(tokens);
    resetEnvironment();
  };

  return <SignInMobileScreen signin={signin} />;
};

export default SignUpMobileScreen;
