import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const ChangePasswordMobileScreen = () => {
  // const WebAPI = useWebAPI();

  const changepwd = async (_token: string, _password: string) => {
    return;
  };
  return <ChangePasswordScreen changePassword={changepwd} />;
};

export default ChangePasswordMobileScreen;
