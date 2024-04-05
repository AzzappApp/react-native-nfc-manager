import sgMail from '@sendgrid/mail';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import QRCode from 'qrcode';
import { getProfileWithWebCardById, getUserById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildEmailSignatureGenerationUrl } from '@azzapp/shared/urlHelpers';
import { buildAvatarUrl } from '#helpers/avatar';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';
import type { NextRequest } from 'next/server';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const PUBLIC_URL = process.env.NEXT_PUBLIC_URL!; // replace with ngrok for dev
const SENDGRIP_NOREPLY_SENDER = process.env.SENDGRIP_NOREPLY_SENDER!;
const generateEmailSignature = async (req: NextRequest) => {
  try {
    const { userId } = (await getSessionData()) ?? {};
    if (!userId) {
      return new Response('Invalid request', { status: 400 });
    }

    const profileId = new URL(req.url).searchParams.get('profileId')!;

    const res = await getProfileWithWebCardById(profileId);
    if (!res) {
      return new Response('Invalid request', { status: 400 });
    }
    if (!res.Profile?.contactCard) {
      return new Response('Invalid request', { status: 400 });
    }

    const webCardUrl = `${PUBLIC_URL}/api/cover/${
      res.WebCard?.userName
    }?width=${630}&updatedAt=${res.WebCard?.updatedAt.toISOString()}`;
    const avatarUrl = await buildAvatarUrl(res.Profile, null);
    const { data, signature } = await serializeAndSignEmailSignature(
      res.WebCard.userName,
      profileId,
      res.WebCard.id,
      res.Profile.contactCard,
      res.WebCard.commonInformation,
      avatarUrl,
    );

    const { data: contactCardData, signature: contactCardSignature } =
      await serializeAndSignContactCard(
        res.WebCard.userName,
        profileId,
        res.WebCard.id,
        res.Profile.contactCard,
        res.WebCard.commonInformation,
      );

    const mailParam: Record<string, Array<{ number: string }> | string> = {
      webCardUrl,
      qrCode: await QRCode.toDataURL(`${PUBLIC_URL}/${res.WebCard?.userName}`), // qrCode is a simple to send to the profile page only (per spec)
      linkUrl: buildEmailSignatureGenerationUrl(
        res.WebCard.userName,
        data,
        signature,
        contactCardData,
        contactCardSignature,
      ),
    };
    const displayName = formatDisplayName(
      res?.Profile?.contactCard?.firstName,
      res?.Profile?.contactCard?.lastName,
    );
    if (displayName) {
      mailParam.displayName = displayName;
    }
    if (res?.Profile?.contactCard?.title) {
      mailParam.title = res?.Profile?.contactCard?.title;
    }
    const comp =
      res?.WebCard?.commonInformation?.company ??
      res?.Profile?.contactCard?.company;
    if (comp) {
      mailParam.company = comp;
    }
    const phones = (res?.WebCard?.commonInformation?.phoneNumbers ?? []).concat(
      res?.Profile?.contactCard?.phoneNumbers?.filter(p => p.selected) ?? [],
    );

    if (phones && phones.length > 0) {
      mailParam.phones = phones.map(item => ({
        number: item.number,
      }));
    }
    const formattedAvatarUrl = await buildAvatarUrl(res.Profile, null);
    if (formattedAvatarUrl) {
      mailParam.avatarUrl = formattedAvatarUrl;
    }
    const userEmail = await getUserById(userId);

    if (userEmail?.email) {
      const msg = {
        to: userEmail.email,
        from: SENDGRIP_NOREPLY_SENDER,
        templateId: 'd-4a7abf7cd3274be1b59bd825618b50c5',
        dynamic_template_data: mailParam,
      };

      await sgMail.send(msg);

      return NextResponse.json(
        {
          message: 'sent',
        },
        {
          status: 200,
        },
      );
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  } catch (e) {
    console.error(e);
    if ((e as Error).message === ERRORS.INVALID_TOKEN) {
      return NextResponse.json(
        { message: ERRORS.INVALID_TOKEN },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
};

export const { POST, OPTIONS } = cors({
  POST: withAxiom(generateEmailSignature),
});

export const runtime = 'nodejs';
