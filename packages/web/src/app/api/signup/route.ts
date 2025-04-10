import * as Sentry from '@sentry/nextjs';
import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  createFreeSubscriptionForBetaAndroidPeriod,
  createUser,
  getLastTermsOfUse,
  getProfilesByUser,
  getUserByEmail,
  getUserByPhoneNumber,
  transaction,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { PLATFORM_HEADER } from '@azzapp/shared/networkHelpers';
import {
  REGEX_PWD,
  formatPhoneNumber,
  isInternationalPhoneNumber,
} from '@azzapp/shared/stringHelpers';
import { handleSignInAuthMethod } from '#helpers/auth';
import { withPluginsRoute } from '#helpers/queries';
import { sendTwilioVerificationCode } from '#helpers/twilioHelpers';
import type { User } from '@azzapp/data';

const SignupSchema = z
  .object({
    email: z.string().email(ERRORS.EMAIL_NOT_VALID).optional().nullable(),
    phoneNumber: z
      .string()
      .optional()
      .nullable()
      .refine(val => (val ? isInternationalPhoneNumber(val) : true), {
        message: ERRORS.PHONENUMBER_NOT_VALID,
      }),
    password: z.string().regex(REGEX_PWD, ERRORS.PASSWORD_NOT_VALID),
    locale: z.string().optional(),
    hasAcceptedCommunications: z.boolean(),
  })
  .refine(
    ({ phoneNumber, email }) => {
      return phoneNumber || email;
    },
    () => ({
      message: ERRORS.EMAIL_NOT_VALID,
      path: ['phoneNumber', 'email'],
    }),
  );

const handleExistingUser = async (user: User, password: string) => {
  //try to login the user
  try {
    //TODO: review Security: Use a constant-time comparison function like crypto.timingSafeEqual()
    // instead of bcrypt.compareSync() to compare passwords. This helps prevent timing attacks.
    if (user?.password && bcrypt.compareSync(password, user.password)) {
      // we can log the user
      const profiles = await getProfilesByUser(user.id);
      return await handleSignInAuthMethod(user, profiles.at(0));
    } else if (!user?.password && user.invited) {
      await updateUser(user.id, {
        password: bcrypt.hashSync(password, 12),
        roles: null,
        invited: false,
      });

      const profiles = await getProfilesByUser(user.id);
      return await handleSignInAuthMethod(user, profiles.at(0));
    }
  } catch {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { message: ERRORS.INVALID_REQUEST },
    { status: 400 },
  );
};

export const POST = withPluginsRoute(async (req: Request) => {
  const result = SignupSchema.safeParse(await req.json());

  if (result.success === false) {
    for (const error of result.error.errors) {
      if (
        error.path[0] === 'phoneNumber' ||
        error.path[0] === 'email' ||
        error.path[0] === 'password'
      ) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const { email, phoneNumber, password, locale, hasAcceptedCommunications } =
    result.data;

  try {
    let user: User | null = null;
    if (email) {
      user = await getUserByEmail(email);
      if (user != null && !user.deleted) {
        return handleExistingUser(user, password);
      }
    }

    if (phoneNumber) {
      user = await getUserByPhoneNumber(formatPhoneNumber(phoneNumber));
      if (user != null && !user.deleted) {
        return handleExistingUser(user, password);
      }
    }

    const userPhoneNumber = phoneNumber ? formatPhoneNumber(phoneNumber) : null;
    const termsOfUse = await getLastTermsOfUse();
    if (user) {
      await transaction(async () => {
        await updateUser(user.id, {
          email: null,
          phoneNumber: null,
          appleId: null,
        });

        const userId = await createUser({
          email: email ?? null,
          phoneNumber: userPhoneNumber,
          password: bcrypt.hashSync(password, 12),
          locale: locale ?? null,
          roles: null,
          termsOfUseAcceptedVersion: termsOfUse?.version ?? null,
          termsOfUseAcceptedAt: termsOfUse ? new Date() : null,
          hasAcceptedCommunications,
        });
        if (req.headers.get(PLATFORM_HEADER) === 'android') {
          await createFreeSubscriptionForBetaAndroidPeriod([userId]);
        }

        await updateUser(user.id, {
          replacedBy: userId,
        });
      });
    } else {
      await transaction(async () => {
        const userId = await createUser({
          email: email ?? null,
          phoneNumber: userPhoneNumber,
          password: bcrypt.hashSync(password, 12),
          locale: locale ?? null,
          roles: null,
          termsOfUseAcceptedVersion: termsOfUse?.version ?? null,
          termsOfUseAcceptedAt: termsOfUse ? new Date() : null,
          hasAcceptedCommunications,
        });

        if (req.headers.get(PLATFORM_HEADER) === 'android') {
          await createFreeSubscriptionForBetaAndroidPeriod([userId]);
        }
      });
    }

    const issuer = (email ?? userPhoneNumber) as string;
    const verification = await sendTwilioVerificationCode(
      issuer,
      email ? 'email' : 'sms',
      locale,
    );

    if (verification && verification.status === 'canceled') {
      throw new Error('Verification canceled');
    }

    return NextResponse.json({
      issuer,
    });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
});
