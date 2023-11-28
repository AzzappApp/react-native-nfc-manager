import sgMail from '@sendgrid/mail';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  getProfileWithWebCardId,
  getWebCardById,
  UserTable,
  createProfile,
  createUser,
  db,
  getProfileById,
} from '@azzapp/data/domains';
import { SaveContactCardInputSchema } from '@azzapp/data/schema/__generated__/validation';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { getSessionData } from '#helpers/tokens';
import {
  TWILIO_PHONE_NUMBER,
  twilioMessagesService,
} from '#helpers/twilioHelpers';
import type { SessionData } from '#helpers/tokens';
import type { SQLWrapper } from 'drizzle-orm';

const InviteUserSchema = z.object({
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  webCardId: z.string(),
  profileRole: z.enum(['owner', 'admin', 'editor', 'user']),
  contactCard: SaveContactCardInputSchema().optional().nullable(),
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const SENDGRIP_NOREPLY_SENDER = process.env.SENDGRIP_NOREPLY_SENDER!;

export const POST = async (req: Request) => {
  const body = await req.json();

  try {
    const input = InviteUserSchema.parse(body);

    const { phoneNumber, email, webCardId } = input;

    let viewer: SessionData | null = null;
    try {
      viewer = await getSessionData();

      if (!viewer?.userId) {
        return NextResponse.json(
          { message: ERRORS.UNAUTHORIZED },
          { status: 401 },
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
        return NextResponse.json({ message: e.message }, { status: 401 });
      }
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }

    if (!email && !phoneNumber) {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }

    const filters: SQLWrapper[] = [];

    if (email) filters.push(eq(UserTable.email, email));
    if (phoneNumber) filters.push(eq(UserTable.phoneNumber, phoneNumber));

    const invitedUser = await db
      .select()
      .from(UserTable)
      .where(and(...filters))
      .then(res => res.pop());

    const profile = await getProfileWithWebCardId(viewer.userId, webCardId);
    const webCard = await getWebCardById(webCardId);

    if (!profile || !webCard?.isMultiUser || !isAdmin(profile.profileRole))
      return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });

    let createdProfileId;
    await db.transaction(async trx => {
      const userId =
        invitedUser?.id ??
        (await createUser(
          {
            email,
            phoneNumber,
            invited: true,
          },
          trx,
        ));

      const { displayedOnWebCard, isPrivate, avatarId, ...data } =
        input.contactCard ?? {};

      const payload = {
        webCardId: profile.webCardId,
        userId,
        avatarId,
        invited: true,
        contactCard: {
          ...data,
          birthday: data.birthday ?? undefined,
        },
        contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
        contactCardIsPrivate: displayedOnWebCard ?? false,
        profileRole: input.profileRole,
        lastContactCardUpdate: new Date(),
        nbContactCardScans: 0,
        promotedAsOwner: false,
      };

      createdProfileId = await createProfile(payload, trx);
    });

    if (phoneNumber) {
      await twilioMessagesService().create({
        body: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this phone number to join: ${phoneNumber}`,
        to: phoneNumber,
        from: TWILIO_PHONE_NUMBER,
      });
    } else if (email) {
      const msg = {
        to: email,
        from: SENDGRIP_NOREPLY_SENDER, // Change to your verified sender
        subject: `You have been invited to join ${webCard.userName}`,
        text: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}`,
        html: `<div>You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}</div>`,
      };

      await sgMail.send(msg);
    }

    if (!createdProfileId) {
      return NextResponse.json(
        { message: ERRORS.INTERNAL_SERVER_ERROR },
        { status: 400 },
      );
    }

    const createdProfile = await getProfileById(createdProfileId);

    return NextResponse.json(
      {
        profile: createdProfile,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
};

export const runtime = 'nodejs';
