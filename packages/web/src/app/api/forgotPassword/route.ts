import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';
import client from 'twilio';
import {
  getUserByEmail,
  getUserByPhoneNumber,
  getToken,
  deleteToken,
  createToken,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { ForgotPassword } from '#components/email/ForgotPassword';

type ForgotPasswordBody = {
  credential: string;
  locale: string;
};

export const POST = async (req: Request) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { credential } = (await req.json()) as ForgotPasswordBody;
  if (!credential) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  try {
    let user;
    const code = Math.random().toString().substring(2, 8);
    let issuer: string | undefined;
    if (isValidEmail(credential)) {
      user = await getUserByEmail(credential);

      if (user?.email) {
        const existingToken = await getToken(user.id);

        if (existingToken) {
          await deleteToken(existingToken.userId);
        }

        await createToken({
          userId: user.id,
          issuer: user.email,
          value: code,
        });

        await resend.emails.send({
          from: 'azzapp <onboarding@resend.dev>', //todo change email with no-reply (domain configuration needed)
          to: [user.email],
          subject: 'Azzapp - Reset your password', //todo i18n
          react: ForgotPassword({
            code,
            email: user.email,
          }) as React.ReactElement,
        });

        issuer = user.email;
      }
    }
    if (user == null && isInternationalPhoneNumber(credential)) {
      user = await getUserByPhoneNumber(credential);

      if (user?.phoneNumber) {
        const existingToken = await getToken(user.id);

        if (existingToken) {
          await deleteToken(existingToken.userId);
        }

        await createToken({
          userId: user.id,
          issuer: user.phoneNumber,
          value: code,
        });

        const twilioClient = new client.Twilio(
          process.env.TWILIO_ACCOUNT_SID ?? '',
          process.env.TWILIO_AUTH_TOKEN ?? '',
        );

        await twilioClient.messages.create({
          body: `Please enter the follow code to reset your password: ${code}`, //todo i18n
          from: process.env.TWILIO_PHONE_NUMBER ?? '',
          to: user.phoneNumber,
        });
        issuer = user.phoneNumber;
      }
    }
    if (user == null || issuer === undefined) {
      // TODO we should not leak the fact that the user does not exist
      // this is a security risk
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }

    return NextResponse.json({ issuer });
  } catch (error) {
    Sentry.captureException(error);
    console.error(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const runtime = 'nodejs';
