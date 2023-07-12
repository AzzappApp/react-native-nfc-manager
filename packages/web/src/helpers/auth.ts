import { NextResponse } from 'next/server';
import { destroySession, setSession } from '@azzapp/auth/session';
import { generateTokens } from '@azzapp/auth/tokens';
import type { User, Profile } from '@azzapp/data/domains';

export const handleSigninAuthMethod = async (
  authMethod: 'cookie' | 'token' | undefined,
  user: User,
  profile: Profile | null | undefined,
) => {
  if (authMethod === 'token') {
    const { token, refreshToken } = await generateTokens({
      userId: user.id,
      profileId: profile?.id,
    });
    return destroySession(
      NextResponse.json({
        ok: true,
        profileId: profile?.id,
        userId: user.id,
        token,
        refreshToken,
      }),
    );
  } else {
    return setSession(NextResponse.json({ profileId: profile?.id }), {
      userId: user.id,
      profileId: profile?.id,
      isAnonymous: false,
    });
  }
};
