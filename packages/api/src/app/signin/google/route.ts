import env from '#env';
import { oauthSignin } from '../oauthSigninUtils';

const googleSignin = oauthSignin({
  authorizeURL: 'https://accounts.google.com/o/oauth2/v2/auth',
  redirectURI: '/signin/google/callback',
  errorCallback: '/signin/google/error',
  clientId: env.GOOGLE_CLIENT_ID,
  csrfSecret: new TextEncoder().encode(env.GOOGLE_TOKEN_SECRET),
  scope: 'profile email',
});

export { googleSignin as GET };

export const runtime = 'nodejs';
