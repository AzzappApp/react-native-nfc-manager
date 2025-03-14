import { SignJWT } from 'jose';

import { NextResponse } from 'next/server';
import { getProfileById, getWebCardById, createId } from '@azzapp/data';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { displayName } from '#helpers/contactCardHelpers';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';

const JWT_SECRET = process.env.JWT_SECRET as string;

const verifySignApi = async (req: Request) => {
  const request = await req.json();
  const { signature, data, salt } = request;

  if (!signature || !data || !salt) {
    return new Response('Invalid request', { status: 400 });
  }

  const decodedData = decodeURIComponent(data);

  const foundContactCard = parseContactCard(decodedData);

  const [isValid, storedProfile, webCard] = await Promise.all([
    verifyHmacWithPassword(
      process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
      signature,
      decodedData,
      { salt },
    ),
    getProfileById(foundContactCard.profileId),
    getWebCardById(foundContactCard.webCardId),
  ]);

  if (isValid) {
    const avatarUrl =
      storedProfile && (await buildAvatarUrl(storedProfile, webCard));

    const token = await new SignJWT({
      avatarUrl,
      userId: storedProfile?.userId,
      isMultiUser: webCard?.isMultiUser,
      firstName: foundContactCard.firstName,
      lastName: foundContactCard.lastName,
      company: foundContactCard.company,
      title: foundContactCard?.title,
      userName: webCard?.userName,
    })
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
        ).concat(storedProfile?.contactCard?.urls || []),
        socials: (webCard?.isMultiUser
          ? (webCard?.commonInformation?.socials ?? [])
          : []
        ).concat(storedProfile?.contactCard?.socials || []),
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
