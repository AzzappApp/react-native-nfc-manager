import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import { getProfileWithWebCardById, getUserById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { buildEmailSignatureGenerationUrl } from '@azzapp/shared/urlHelpers';
import { buildAvatarUrl } from '#helpers/avatar';
import cors from '#helpers/cors';
import { sendTemplateEmail } from '#helpers/emailHelpers';
import { getSessionData } from '#helpers/tokens';
import type { NextRequest } from 'next/server';

const EmailSignatureSignSchema = z.object({
  profileId: z.string(),
  preview: z.string(),
});

const generateEmailSignature = async (req: NextRequest) => {
  try {
    const { userId } = (await getSessionData()) ?? {};
    if (!userId) {
      return new Response('Invalid request', { status: 400 });
    }
    const body = await req.json();
    const input = EmailSignatureSignSchema.parse(body);
    const { preview, profileId } = input;

    const res = await getProfileWithWebCardById(profileId);
    if (!res) {
      return new Response('Invalid request', { status: 400 });
    }
    const { profile, webCard } = res;
    if (!profile?.contactCard) {
      return new Response('Invalid request', { status: 400 });
    }

    const avatarUrl = await buildAvatarUrl(profile, null);
    const { data, signature } = await serializeAndSignEmailSignature(
      webCard.userName,
      profileId,
      webCard.id,
      profile.contactCard,
      webCard.commonInformation,
      avatarUrl,
    );

    const { data: contactCardData, signature: contactCardSignature } =
      await serializeAndSignContactCard(
        webCard.userName,
        profileId,
        webCard.id,
        profile.contactCard,
        webCard.commonInformation,
      );

    const mailParam: Record<
      string,
      Array<{ mail: string }> | Array<{ number: string }> | string
    > = {
      linkUrl: buildEmailSignatureGenerationUrl(
        webCard.userName,
        data,
        signature,
        contactCardData,
        contactCardSignature,
      ),
    };

    const userEmail = await getUserById(userId);

    if (userEmail?.email) {
      await sendTemplateEmail({
        to: userEmail.email,
        templateId: 'd-87dd47b327fa44b38f7bdbea5cb6daaf',
        dynamicTemplateData: mailParam,
        attachments: [
          {
            filename: 'azzapp_contact.jpg',
            content: preview,
            type: 'image/jpeg',
            contentId: 'contact',
            disposition: 'inline',
          },
        ],
      });

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
