import env from '#env';
import { oauthSigninCallback } from '../../oauthSigninUtils';

const googleSigninCallback = oauthSigninCallback({
  tokenURL: 'https://oauth2.googleapis.com/token',
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectURI: '/signin/google/callback',
  csrfSecret: new TextEncoder().encode(env.GOOGLE_TOKEN_SECRET),
});

export { googleSigninCallback as GET };

export const runtime = 'nodejs';
