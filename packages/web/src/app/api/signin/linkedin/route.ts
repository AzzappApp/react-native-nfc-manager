import cuid2 from '@paralleldrive/cuid2';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const NEXT_PUBLIC_API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;
const LINKEDIN_AUTHORIZE_URL =
  'https://www.linkedin.com/oauth/v2/authorization';

const csrfSecret = new TextEncoder().encode(process.env.LINKEDIN_TOKEN_SECRET);

const linkedInSignin = async () => {
  const url = new URL(LINKEDIN_AUTHORIZE_URL);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', CLIENT_ID);
  url.searchParams.append(
    'redirect_uri',
    `${NEXT_PUBLIC_API_ENDPOINT}/signin/linkedin/callback`,
  );
  const csrfToken = await new SignJWT({ csrf: cuid2.createId() })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(csrfSecret);

  url.searchParams.append('state', csrfToken);
  url.searchParams.append('scope', 'profile email openid');

  return NextResponse.redirect(url.toString(), { status: 302 });
};

export { linkedInSignin as GET };
