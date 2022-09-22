import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignInScreen from '@azzapp/app/lib/screens/SignInScreen';
import Head from 'next/head';
import { getMessages } from '../helpers/i18nmessages';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';
import type { GetStaticProps } from 'next';

const SignInPage = () => {
  const router = useRouter();
  const WebAPI = useWebAPI();
  const signin = (params: SignInParams) =>
    WebAPI.signin(params).then(() => {
      router.replace({ route: 'HOME' });
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

export const getStaticProps: GetStaticProps = context => {
  return {
    props: {
      i18nMessages: getMessages('signin', context.locale),
    },
  };
};

export default SignInPage;
