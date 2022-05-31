import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignUpScreen from '@azzapp/app/lib/SignUpScreen';
import ROUTES from '@azzapp/shared/lib/routes';
import Head from 'next/head';
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

const SingupPage = () => {
  const WebAPI = useWebAPI();
  const router = useRouter();
  const signup = (params: SignUpParams) =>
    WebAPI.signup(params).then(() => {
      router.replace(ROUTES.HOME);
    });

  return (
    <div className="root">
      <Head>
        <title>Sign in</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <SignUpScreen signup={signup} />
    </div>
  );
};

export default SingupPage;
