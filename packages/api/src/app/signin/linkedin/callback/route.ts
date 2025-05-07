import env from '#env';
import { oauthSigninCallback } from '../../oauthSigninUtils';

const linkedInSigninCallback = oauthSigninCallback({
  tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  clientId: env.LINKEDIN_CLIENT_ID,
  clientSecret: env.LINKEDIN_CLIENT_SECRET,
  redirectURI: '/signin/linkedin/callback',
  csrfSecret: new TextEncoder().encode(env.LINKEDIN_TOKEN_SECRET),
  profileURL: 'https://api.linkedin.com/v2/userinfo',
});

export { linkedInSigninCallback as GET };

export const runtime = 'nodejs';
