'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

const IndexPage = () => (
  <>
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
  </>
);

export default IndexPage;

export const dynamic = 'force-static';
