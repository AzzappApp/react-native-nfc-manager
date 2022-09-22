import { useRouter, useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import SignUpScreen from '@azzapp/app/lib/screens/SignUpScreen';
import Head from 'next/head';
import { getMessages } from '../helpers/i18nmessages';
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';
import type { GetStaticProps } from 'next';

const SingupPage = () => {
  const WebAPI = useWebAPI();
  const router = useRouter();
  const signup = (params: SignUpParams) =>
    WebAPI.signup(params).then(() => {
      router.replace({ route: 'HOME' });
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

export const getStaticProps: GetStaticProps = context => {
  return {
    props: {
      i18nMessages: getMessages('signup', context.locale),
    },
  };
};

export default SingupPage;
