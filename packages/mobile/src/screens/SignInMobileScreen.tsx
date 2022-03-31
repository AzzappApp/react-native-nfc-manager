import { useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignInScreen from '@azzapp/app/lib/SignInScreen';
import { Navigation } from 'react-native-navigation';
import { resetEnvironment } from '../helpers/relayEnvironment';
import { setTokens } from '../helpers/tokensStore';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

const SignInMobileScreen = ({ componentId }: { componentId: string }) => {
  const WebAPI = useWebAPI();
  const signin = async (params: SignInParams) => {
    const tokens = await WebAPI.signin(params);
    await setTokens(tokens);
    resetEnvironment();
    await Navigation.dismissModal(componentId);
  };
  return <SignInScreen signin={signin} />;
};

export default SignInMobileScreen;
