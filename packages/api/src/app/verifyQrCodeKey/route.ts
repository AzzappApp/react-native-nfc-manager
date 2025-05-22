import { SignJWT } from 'jose';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createId } from '@azzapp/data';
import { mergeContactCardWithCommonInfos } from '@azzapp/service/contactCardServices';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import { displayName } from '@azzapp/shared/contactCardHelpers';
import ERRORS from '@azzapp/shared/errors';
import { deserializeGeolocation } from '@azzapp/shared/urlHelpers';
import env from '#env';
import cors from '#helpers/cors';
import { verifyContactCardAccess } from '#helpers/qrCode';
import { withPluginsRoute } from '#helpers/queries';
import type { Geolocation } from '@azzapp/shared/geolocationHelpers';

const JWT_SECRET = env.JWT_SECRET;

const verifyQrCodeKeyBody = z.object({
  contactCardAccessId: z.string().nonempty(),
  key: z.string().nonempty(),
  userName: z.string().nonempty(),
  geolocation: z
    .tuple([
      z.number().nullable(),
      z.number().nullable(),
      z.string().nullable(),
      z.string().nullable(),
      z.string().nullable(),
      z.string().nullable(),
    ])
    .optional()
    .nullable(),
});

export type VerifyQrCodeBody = z.infer<typeof verifyQrCodeKeyBody>;

export type VerifySignToken = {
  avatarUrl?: string | null;
  userId: string;
  isMultiUser?: boolean;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  userName?: string | null;
  geolocation: Geolocation | null;
};

const verifyQrCodeKeyApi = async (req: Request) => {
  const request = await req.json();
  const result = verifyQrCodeKeyBody.safeParse(request);

  if (!result.success) {
    return new Response('Invalid request', { status: 400 });
  }
  const { key, contactCardAccessId, geolocation, userName } = result.data;
  try {
    const { profile, webCard } = await verifyContactCardAccess(
      contactCardAccessId,
      key,
      userName,
    );

    if (profile) {
      const avatarUrl = await buildAvatarUrl(profile, webCard);

      // the payload has been copied from verifySign - don’t understand why we have all these fields (seems there is duplication with the response) - to be analyzed
      const token = await new SignJWT({
        avatarUrl,
        userId: profile.userId,
        isMultiUser: webCard?.isMultiUser,
        firstName: profile.contactCard?.firstName ?? '',
        lastName: profile.contactCard?.lastName ?? '',
        company: profile.contactCard?.company ?? '',
        title: profile.contactCard?.title ?? '',
        userName: webCard?.userName,
        geolocation: geolocation ? deserializeGeolocation(geolocation) : null,
      } satisfies VerifySignToken)
        .setJti(createId())
        .setIssuer('azzapp')
        .setSubject('contact-card')
        .setIssuedAt()
        .setExpirationTime('20m')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(new TextEncoder().encode(JWT_SECRET));
      return NextResponse.json(
        {
          avatarUrl,
          profileId: profile.id,
          contactCard: mergeContactCardWithCommonInfos(
            webCard,
            profile.contactCard,
          ),
          displayName: displayName(profile.contactCard ?? {}, webCard),
          token,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
};

export const { POST, OPTIONS } = cors({
  POST: withPluginsRoute(verifyQrCodeKeyApi),
});
