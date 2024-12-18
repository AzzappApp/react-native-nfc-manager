import { toGlobalId } from 'graphql-relay';
import { NextResponse } from 'next/server';
import ERRORS from '@azzapp/shared/errors';
import { generateTokens } from './tokens';
import { sendTwilioVerificationCode } from './twilioHelpers';
import type { Profile, User } from '@azzapp/data';

export const handleSignInAuthMethod = async (
  user: User,
  profile: Profile | null | undefined,
) => {
  if (user.deleted) {
    return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });
  }

  if (!user.emailConfirmed && !user.phoneNumberConfirmed) {
    const issuer = (user.email ?? user.phoneNumber) as string;
    const verification = await sendTwilioVerificationCode(
      issuer,
      user.email ? 'email' : 'sms',
      user.locale,
    );

    if (verification && verification.status === 'canceled') {
      throw new Error('Verification canceled');
    }

    return NextResponse.json({
      issuer,
    });
  }

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
          invited: profile.invited,
        }
      : null,
    email: user.email,
    phoneNumber: user.phoneNumber,
    userId: user.id,
    token,
    refreshToken,
    roles: user.roles,
  });
};
