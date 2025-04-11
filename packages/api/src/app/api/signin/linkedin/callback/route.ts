import { oauthSigninCallback } from '../../oauthSigninUtils';

const linkedInSigninCallback = oauthSigninCallback({
  tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectURI: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/linkedin/callback`,
  csrfSecret: new TextEncoder().encode(process.env.LINKEDIN_TOKEN_SECRET),
  profileURL: 'https://api.linkedin.com/v2/userinfo',
});

export { linkedInSigninCallback as GET };

export const runtime = 'nodejs';
