import { NextResponse } from 'next/server';
import { generateTokens } from './tokens';
import type { User, Profile } from '@azzapp/data/domains';

export const handleSigninAuthMethod = async (
  user: User,
  profile: Profile | null | undefined,
) => {
  const { token, refreshToken } = await generateTokens({
    userId: user.id,
  });
  return NextResponse.json({
    ok: true,
    profileId: profile?.id,
    userId: user.id,
    token,
    refreshToken,
  });
};
