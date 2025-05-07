import env from '#env';
import { oauthSignin } from '../oauthSigninUtils';

const linkedInSignin = oauthSignin({
  authorizeURL: 'https://www.linkedin.com/oauth/v2/authorization',
  redirectURI: '/signin/linkedin/callback',
  clientId: env.LINKEDIN_CLIENT_ID!,
  csrfSecret: new TextEncoder().encode(env.LINKEDIN_TOKEN_SECRET),
});

export { linkedInSignin as GET };

export const runtime = 'nodejs';
