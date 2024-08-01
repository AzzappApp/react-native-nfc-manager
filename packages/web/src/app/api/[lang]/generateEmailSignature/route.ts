import sgMail from '@sendgrid/mail';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import { getProfileWithWebCardById, getUserById } from '@azzapp/data';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { buildEmailSignatureGenerationUrl } from '@azzapp/shared/urlHelpers';
import { buildAvatarUrl } from '#helpers/avatar';
import cors from '#helpers/cors';
import { buildCoverImageUrl } from '#helpers/cover';
import { getSessionData } from '#helpers/tokens';
import type { MailDataRequired } from '@sendgrid/mail';
import type { NextRequest } from 'next/server';

const COVER_WIDTH = 630;

const EmailSignatureSignSchema = z.object({
  profileId: z.string(),
  preview: z.string(),
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const SENDGRIP_NOREPLY_SENDER = process.env.SENDGRIP_NOREPLY_SENDER!;
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
    if (!res.Profile?.contactCard) {
      return new Response('Invalid request', { status: 400 });
    }

    const webCardUrl = await buildCoverImageUrl(res.WebCard, {
      width: COVER_WIDTH,
      height: COVER_WIDTH / COVER_RATIO,
      crop: 'fit',
    });

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

    const mailParam: Record<
      string,
      Array<{ mail: string }> | Array<{ number: string }> | string
    > = {
      linkUrl: buildEmailSignatureGenerationUrl(
        res.WebCard.userName,
        data,
        signature,
        contactCardData,
        contactCardSignature,
      ),
    };
    if (webCardUrl) {
      mailParam.webCardUrl = webCardUrl;
    }

    const userEmail = await getUserById(userId);

    if (userEmail?.email) {
      const msg: MailDataRequired = {
        to: userEmail.email,
        from: SENDGRIP_NOREPLY_SENDER,
        templateId: 'd-87dd47b327fa44b38f7bdbea5cb6daaf',
        dynamicTemplateData: mailParam,
        attachments: [
          {
            filename: 'azzapp_contact.jpg',
            content: preview,
            type: 'image/jpeg',
            //@ts-expect-error is mandatory to make if work, api issue (replacing   //contentId: 'contact',)
            content_id: 'contact',
            disposition: 'inline',
          },
        ],
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
