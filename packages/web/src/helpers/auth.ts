import { toGlobalId } from 'graphql-relay';
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
    profileInfos: profile
      ? {
          profileId: toGlobalId('Profile', profile.id),
          profileRole: profile.profileRole,
          webCardId: toGlobalId('WebCard', profile.webCardId),
        }
      : null,
    userId: user.id,
    token,
    refreshToken,
  });
};
