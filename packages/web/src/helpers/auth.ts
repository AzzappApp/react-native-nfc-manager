import { toGlobalId } from 'graphql-relay';
import { NextResponse } from 'next/server';
import { getWebCardById, type Profile, type User } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { generateTokens } from './tokens';
import { sendTwilioVerificationCode } from './twilioHelpers';

export const handleSignInAuthMethod = async (
  user: User,
  profile: Profile | null | undefined,
) => {
  try {
    return NextResponse.json(await retrieveSigninInfos(user, profile));
  } catch {
    return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });
  }
};

export type SigninInfos =
  | {
      profileInfos: {
        profileId: string;
        profileRole: string;
        webCardId: string;
        invited: boolean;
        webCardUserName?: string | null;
        cardIsPublished?: boolean;
        coverIsPredefined?: boolean;
      } | null;
      email: string | null;
      phoneNumber: string | null;
      userId: string;
      token: string;
      refreshToken: string;
      roles: string[] | null;
    }
  | { issuer: string };

export const retrieveSigninInfos = async (
  user: User,
  profile: Profile | null | undefined,
): Promise<SigninInfos> => {
  if (user.deleted && user.id !== user.deletedBy) {
    throw new Error('User deleted');
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

    return { issuer };
  }

  const { token, refreshToken } = await generateTokens({
    userId: user.id,
  });

  const webCard = await getWebCardById(profile?.webCardId ?? '');

  return {
    profileInfos: profile
      ? {
          profileId: toGlobalId('Profile', profile.id),
          profileRole: profile.profileRole,
          webCardId: toGlobalId('WebCard', profile.webCardId),
          invited: profile.invited,
          webCardUserName: webCard?.userName,
          cardIsPublished: webCard?.cardIsPublished,
          coverIsPredefined: webCard?.coverIsPredefined,
        }
      : null,
    email: user.email,
    phoneNumber: user.phoneNumber,
    userId: user.id,
    token,
    refreshToken,
    roles: user.roles,
  };
};
