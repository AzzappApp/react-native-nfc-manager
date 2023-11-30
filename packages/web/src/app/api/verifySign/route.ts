import { NextResponse } from 'next/server';
import { getProfileById } from '@azzapp/data/domains';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';

const verifySignApi = async (req: Request) => {
  const { signature, data, salt } =
    ((await req.json()) as {
      signature?: string;
      data?: string;
      salt?: string;
    }) || {};

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

    return NextResponse.json(
      {
        urls: storedProfile?.contactCard?.urls?.filter(url => url.selected),
        socials: storedProfile?.contactCard?.socials?.filter(
          social => social.selected,
        ),
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

export const { POST, OPTIONS } = cors({ POST: verifySignApi });

export const runtime = 'edge';
