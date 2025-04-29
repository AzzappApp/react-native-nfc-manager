import { SignJWT } from 'jose';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createId,
  getContactCardAccessById,
  updateContactCardAccessLastRead,
  getProfileWithWebCardById,
} from '@azzapp/data';
import { mergeContactCardWithCommonInfos } from '@azzapp/service/contactCardServices';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import { importPublicKey, verifyMessage } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { deserializeGeolocation } from '@azzapp/shared/urlHelpers';
import { displayName } from '#helpers/contactCardHelpers';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';
import type { Geolocation } from '@azzapp/shared/geolocationHelpers';

const JWT_SECRET = process.env.JWT_SECRET as string;

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

  const contactCardAccess = await getContactCardAccessById(contactCardAccessId);

  if (!contactCardAccess || contactCardAccess.isRevoked) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const cryptoKey = await importPublicKey(key);

  const isValid = await verifyMessage(
    cryptoKey,
    contactCardAccess.profileId,
    contactCardAccess.signature,
  );

  if (!isValid) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  await updateContactCardAccessLastRead(contactCardAccessId);

  const res = await getProfileWithWebCardById(contactCardAccess.profileId);
  if (!res) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  const { profile: storedProfile, webCard } = res;

  if (webCard?.userName?.toLowerCase() !== userName.toLowerCase()) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  if (storedProfile) {
    const avatarUrl = await buildAvatarUrl(storedProfile, webCard);

    // the payload has been copied from verifySign - don’t understand why we have all these fields (seems there is duplication with the response) - to be analyzed
    const token = await new SignJWT({
      avatarUrl,
      userId: storedProfile.userId,
      isMultiUser: webCard?.isMultiUser,
      firstName: storedProfile.contactCard?.firstName ?? '',
      lastName: storedProfile.contactCard?.lastName ?? '',
      company: storedProfile.contactCard?.company ?? '',
      title: storedProfile.contactCard?.title ?? '',
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
        profileId: storedProfile.id,
        contactCard: mergeContactCardWithCommonInfos(
          webCard,
          storedProfile.contactCard,
        ),
        displayName: displayName(storedProfile.contactCard ?? {}, webCard),
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
};

export const { POST, OPTIONS } = cors({
  POST: withPluginsRoute(verifyQrCodeKeyApi),
});
