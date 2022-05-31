import Head from 'next/head';
import Link from 'next/link';

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
    <Link href="/signin">Sing in</Link>
    <br />
    <Link href="/signup">Sign up</Link>
    <br />
  </div>
);

export default IndexPage;
