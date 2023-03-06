import Link from 'next/link';
import { getServerIntl, useServerIntl } from '#helpers/i18nHelpers';

const IndexPage = () => {
  const intl = useServerIntl();
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
