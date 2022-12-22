import Head from 'next/head';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import { getMessages } from '../helpers/i18nmessages';
import type { GetStaticProps } from 'next';

const IndexPage = () => (
  <div className="root">
    <Head>
      <title>Welcom to AZZAPP</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <h1>Welcome to AZZAPP</h1>
    <Link href="/home">Home</Link>
    <br />
    <Link href="/signin">
      <FormattedMessage
        defaultMessage="Sign In"
        description="Sign In link in web home page"
      />
    </Link>
    <br />
    <Link href="/signup">
      <FormattedMessage
        defaultMessage="Sign Up"
        description="Sign Up link in web home page"
      />
    </Link>
    <br />
  </div>
);

export const getStaticProps: GetStaticProps = context => ({
  props: {
    i18nMessages: getMessages('index', context.locale),
  },
});

export default IndexPage;
