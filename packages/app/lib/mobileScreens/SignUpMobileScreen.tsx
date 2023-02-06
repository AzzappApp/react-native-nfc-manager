import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import { useWebAPI } from '../PlatformEnvironment';

import SignUpScreen from '../screens/SignUpScreen';
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

const SignUpMobileScreen = () => {
  const WebAPI = useWebAPI();

  const signup = async (params: SignUpParams) => {
    const tokens = await WebAPI.signup(params);
    await setTokens(tokens);
    resetEnvironment();
  };
  return <SignUpScreen signup={signup} />;
};

export default SignUpMobileScreen;
