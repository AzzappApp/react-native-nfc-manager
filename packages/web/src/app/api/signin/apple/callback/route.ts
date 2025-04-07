import { SignJWT } from 'jose';
import { oauthSigninCallback } from '../../oauthSigninUtils';

async function generateAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 6) // 6 heures
    .setAudience('https://appleid.apple.com')
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .sign(
      await crypto.subtle.importKey(
        'pkcs8',
        new TextEncoder().encode(process.env.APPLE_PRIVATE_KEY!),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign'],
      ),
    );

  return jwt;
}

const appleSigninCallback = oauthSigninCallback({
  tokenURL: 'https://appleid.apple.com/auth/token',
  clientId: process.env.APPLE_CLIENT_ID!,
  clientSecret: generateAppleClientSecret,
  redirectURI: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/apple/callback`,
  csrfSecret: new TextEncoder().encode(process.env.APPLE_TOKEN_SECRET),
});

export { appleSigninCallback as GET };

export const runtime = 'nodejs';
