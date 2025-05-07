import { importPKCS8, SignJWT } from 'jose';
import env from '#env';
import { oauthSigninCallback } from '../../oauthSigninUtils';

const APPLE_PRIVATE_KEY = env.APPLE_PRIVATE_KEY;
const APPLE_TEAM_IDENTIFIER = env.APPLE_TEAM_IDENTIFIER;
const APPLE_CLIENT_ID = env.APPLE_CLIENT_ID;
const APPLE_KEY_ID = env.APPLE_KEY_ID;

async function generateAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);

  const privateKey = await importPKCS8(APPLE_PRIVATE_KEY, 'ES256');

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_IDENTIFIER)
    .setSubject(APPLE_CLIENT_ID)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 6) // 6h
    .sign(privateKey);

  return jwt;
}

const appleSigninCallback = oauthSigninCallback({
  tokenURL: 'https://appleid.apple.com/auth/token',
  clientId: APPLE_CLIENT_ID,
  clientSecret: generateAppleClientSecret,
  redirectURI: '/signin/apple/callback',
  csrfSecret: new TextEncoder().encode(env.APPLE_TOKEN_SECRET),
});

export { appleSigninCallback as POST };

export const runtime = 'nodejs';
