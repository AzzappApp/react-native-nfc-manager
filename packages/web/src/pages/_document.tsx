import { Html, Main, NextScript, Head } from 'next/document';

const Document = () => (
  <Html lang="fr">
    <Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap"
        rel="stylesheet"
      />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
