import { NextResponse } from 'next/server';
import { generateTokens } from './tokens';
import type { Profile, User } from '@azzapp/data/domains';

export const handleSignInAuthMethod = async (
  user: User,
  profile: Profile | null | undefined,
) => {
  const { token, refreshToken } = await generateTokens({
    userId: user.id,
  });
  return NextResponse.json({
    ok: true,
    webCardId: profile?.webCardId,
    profileRole: profile?.profileRole,
    userId: user.id,
    token,
    refreshToken,
  });
};
