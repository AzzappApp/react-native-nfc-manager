import { oauthSignin } from '../oauthSigninUtils';

const googleSignin = oauthSignin({
  authorizeURL: 'https://accounts.google.com/o/oauth2/v2/auth',
  redirectURI: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/google/callback`,
  errorCallback: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/google/error`,
  clientId: process.env.GOOGLE_CLIENT_ID!,
  csrfSecret: new TextEncoder().encode(process.env.GOOGLE_TOKEN_SECRET),
  scope: 'profile email',
  prompt: 'consent',
});

export { googleSignin as GET };

export const runtime = 'nodejs';
