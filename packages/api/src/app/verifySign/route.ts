import { SignJWT } from 'jose';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProfileById, getWebCardById, createId } from '@azzapp/data';
import { CONTACT_CARD_SIGNATURE_SECRET } from '@azzapp/service/contactCardSerializationServices';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import {
  parseContactCard,
  displayName,
} from '@azzapp/shared/contactCardHelpers';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import env from '#env';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';

const JWT_SECRET = env.JWT_SECRET as string;

const verifySignBody = z.object({
  signature: z.string().nonempty(),
  data: z.string().nonempty(),
  salt: z.string(),
  geolocation: z
    .object({
      location: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
      address: z
        .object({
          country: z.string().nullable(),
          city: z.string().nullable(),
          subregion: z.string().nullable(),
          region: z.string().nullable(),
        })
        .optional(),
    })
    .optional(),
});

export type VerifySignBody = z.infer<typeof verifySignBody>;

export type VerifySignToken = {
  avatarUrl?: string | null;
  userId: string;
  isMultiUser?: boolean;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  userName?: string | null;
  geolocation: VerifySignBody['geolocation'];
};

const verifySignApi = async (req: Request) => {
  const request = await req.json();
  const result = verifySignBody.safeParse(request);

  if (!result.success) {
    return new Response('Invalid request', { status: 400 });
  }
  const { signature, data, salt, geolocation } = result.data;

  const decodedData = decodeURIComponent(data);

  const foundContactCard = parseContactCard(decodedData);

  const [isValid, storedProfile, webCard] = await Promise.all([
    verifyHmacWithPassword(
      CONTACT_CARD_SIGNATURE_SECRET,
      signature,
      decodedData,
      { salt },
    ),
    getProfileById(foundContactCard.profileId),
    getWebCardById(foundContactCard.webCardId),
  ]);
  if (isValid && storedProfile) {
    const avatarUrl = await buildAvatarUrl(storedProfile, webCard);

    const token = await new SignJWT({
      avatarUrl,
      userId: storedProfile.userId,
      isMultiUser: webCard?.isMultiUser,
      firstName: foundContactCard.firstName,
      lastName: foundContactCard.lastName,
      company: foundContactCard.company,
      title: foundContactCard?.title,
      userName: webCard?.userName,
      geolocation,
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
        urls: (webCard?.isMultiUser
          ? (webCard?.commonInformation?.urls ?? [])
          : []
        ).concat(storedProfile.contactCard?.urls || []),
        socials: (webCard?.isMultiUser
          ? (webCard?.commonInformation?.socials ?? [])
          : []
        ).concat(storedProfile.contactCard?.socials || []),
        avatarUrl,
        displayName: displayName(foundContactCard, webCard),
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
  POST: withPluginsRoute(verifySignApi),
});
