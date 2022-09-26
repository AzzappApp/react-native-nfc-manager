import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import type { ForgotPasswordParams } from '@azzapp/shared/lib/WebAPI';

const ForgetPasswordMobileScreen = () => {
  // const WebAPI = useWebAPI();

  const forgot = async (_params: ForgotPasswordParams) => {
    // await WebAPI.forgotPassword(params);
  };
  return <ForgotPasswordScreen forgotPassword={forgot} />;
};

export default ForgetPasswordMobileScreen;
