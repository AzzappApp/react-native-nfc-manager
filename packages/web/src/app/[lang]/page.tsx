import Link from 'next/link';
import { getServerIntl } from '#helpers/i18nHelpers';

type IndexPageProps = {
  params: { lang: string };
};

const IndexPage = ({ params: { lang } }: IndexPageProps) => {
  const intl = getServerIntl(lang);
  return (
    <>
      <h1>Welcome to AZZAPP</h1>
      <Link href="/home">Home</Link>
      <br />
      <Link href="/signin">
        {intl.formatMessage({
          defaultMessage: 'Sign In',
          description: 'Sign In link in web home page',
        })}
      </Link>
      <br />
      <Link href="/signup">
        {intl.formatMessage({
          defaultMessage: 'Sign Up',
          description: 'Sign Up link in web home page',
        })}
      </Link>
      <br />
    </>
  );
};

export default IndexPage;

export const dynamic = 'force-static';

export const generateMetadata = ({
  params: { lang },
}: {
  params: { lang: string };
}) => {
  const intl = getServerIntl(lang);
  return {
    title: intl.formatMessage({
      defaultMessage: 'Azzapp - Welcome',
      description: 'Azzapp welcome page title',
    }),
    description: intl.formatMessage({
      defaultMessage: 'Welcome to Azzapp',
      description: 'Azzapp welcome page description',
    }),
  };
};
