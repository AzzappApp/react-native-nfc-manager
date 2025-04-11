import { oauthSigninCallback } from '../../oauthSigninUtils';

const googleSigninCallback = oauthSigninCallback({
  tokenURL: 'https://oauth2.googleapis.com/token',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectURI: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/google/callback`,
  csrfSecret: new TextEncoder().encode(process.env.GOOGLE_TOKEN_SECRET),
});

export { googleSigninCallback as GET };

export const runtime = 'nodejs';
