import { useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignUpScreen from '@azzapp/app/lib/SignUpScreen';
import { Navigation } from 'react-native-navigation';
import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

const SignUpMobileScreen = ({ componentId }: { componentId: string }) => {
  const WebAPI = useWebAPI();
  const signup = async (params: SignUpParams) => {
    const tokens = await WebAPI.signup(params);
    await setTokens(tokens);
    resetEnvironment();
    await Navigation.dismissModal(componentId);
  };
  return <SignUpScreen signup={signup} />;
};

export default SignUpMobileScreen;
