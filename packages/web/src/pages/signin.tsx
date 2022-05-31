import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignInScreen from '@azzapp/app/lib/SignInScreen';
import ROUTES from '@azzapp/shared/lib/routes';
import Head from 'next/head';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

const SignInPage = () => {
  const router = useRouter();
  const WebAPI = useWebAPI();
  const signin = (params: SignInParams) =>
    WebAPI.signin(params).then(() => {
      router.replace(ROUTES.HOME);
    });

  return (
    <div className="root">
      <Head>
        <title>Sign in</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <SignInScreen signin={signin} />
    </div>
  );
};

export default SignInPage;
