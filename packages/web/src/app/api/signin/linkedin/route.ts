import { oauthSignin } from '../oauthSigninUtils';

const linkedInSignin = oauthSignin({
  authorizeURL: 'https://www.linkedin.com/oauth/v2/authorization',
  redirectURI: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/linkedin/callback`,
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  csrfSecret: new TextEncoder().encode(process.env.LINKEDIN_TOKEN_SECRET),
});

export { linkedInSignin as GET };
