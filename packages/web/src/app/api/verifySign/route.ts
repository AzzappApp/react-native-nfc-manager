import { SignJWT } from 'jose';

import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import { getProfileById, getWebCardById, createId } from '@azzapp/data';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { buildAvatarUrl } from '#helpers/avatar';
import cors from '#helpers/cors';

const JWT_SECRET = process.env.JWT_SECRET as string;

const verifySignApi = async (req: Request) => {
  const request = await req.json();
  const { signature, data, salt } = request;

  if (!signature || !data || !salt) {
    return new Response('Invalid request', { status: 400 });
  }

  const isValid = await verifyHmacWithPassword(
    process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
    signature,
    decodeURIComponent(data),
    { salt },
  );
  if (isValid) {
    const foundContactCard = parseContactCard(decodeURIComponent(data));

    const storedProfile = await getProfileById(foundContactCard.profileId);

    const webCard = await getWebCardById(foundContactCard.webCardId);

    const avatarUrl =
      storedProfile && (await buildAvatarUrl(storedProfile, webCard));

    const token = await new SignJWT({
      avatarUrl,
      userId: storedProfile?.userId,
      isMultiUser: webCard?.isMultiUser,
      firstName: foundContactCard.firstName,
      lastName: foundContactCard.lastName,
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
        urls: (webCard?.commonInformation?.urls ?? []).concat(
          storedProfile?.contactCard?.urls?.filter(url => url.selected) ?? [],
        ),
        socials: (webCard?.commonInformation?.socials ?? []).concat(
          storedProfile?.contactCard?.socials?.filter(
            social => social.selected,
          ) ?? [],
        ),
        avatarUrl,
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

export const { POST, OPTIONS } = cors({ POST: withAxiom(verifySignApi) });
