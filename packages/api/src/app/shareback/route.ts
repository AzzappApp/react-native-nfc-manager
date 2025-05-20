import { jwtDecode } from 'jwt-decode';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  saveShareBack,
  getUserById,
  getProfileByUserAndWebCard,
  getProfileById,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import { sendTemplateEmail } from '@azzapp/service/emailServices';
import { sendPushNotification } from '@azzapp/service/notificationsHelpers';
import { buildVCardFileName } from '@azzapp/shared/contactCardHelpers';
import { filterSocialLink } from '@azzapp/shared/socialLinkHelpers';
import { buildVCardFromShareBackContact } from '@azzapp/shared/vCardHelpers';
import type { VerifySignToken } from '../verifySign/route';
import type { Profile } from '@azzapp/data';
import type { JwtPayload } from 'jwt-decode';

// Define the contact data schema
const contactDataSchema = z.object({
  webCardId: z.string().optional(), //deprecated, use for the old QRCode
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  phoneNumbers: z
    .array(
      z.object({
        label: z.string(),
        number: z.string(),
      }),
    )
    .default([]),
  emails: z
    .array(
      z.object({
        label: z.string(),
        address: z.string(),
      }),
    )
    .default([]),
  addresses: z
    .array(
      z.object({
        label: z.string(),
        address: z.string(),
      }),
    )
    .default([]),
  urls: z
    .array(
      z.object({
        url: z.string(),
      }),
    )
    .default([]),
  socials: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    )
    .default([]),
  meetingLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  meetingPlace: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      region: z.string().optional(),
      subregion: z.string().optional(),
    })
    .optional(),
});

// Define the request body schema
const requestBodySchema = z.object({
  timestamp: z.number(),
  contactData: contactDataSchema,
  token: z.string(),
  profileId: z.string().optional(), //used for the new QRCode Key
});

export type ShareBackFormData = z.infer<typeof contactDataSchema>;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = requestBodySchema.parse(body);
    const { timestamp, contactData, token, profileId } = validatedData;

    // Check if timestamp is within 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 300) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const decodedToken = jwtDecode<JwtPayload & VerifySignToken>(token);

    // verify expiration date
    if (!decodedToken.exp || decodedToken.exp < Date.now() / 1000) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user and profile data
    const user = await getUserById(decodedToken.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    let profile: Profile | null = null;

    if (profileId) {
      profile = await getProfileById(profileId);
    } else if (contactData.webCardId) {
      profile = await getProfileByUserAndWebCard(
        user.id,
        contactData.webCardId,
      );
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Save the shareback contact
    await saveShareBack(profile.id, {
      ...contactData,
      socials: filterSocialLink(contactData.socials),
      type: 'shareback',
      ownerProfileId: profile.id,
    });

    // Send push notification
    await sendPushNotification(profile.userId, {
      notification: {
        type: 'shareBack',
        webCardId: profile.webCardId,
      },
      mediaId: null,
      sound: 'default',
      locale: guessLocale(user.locale),
    });

    // Send email with vCard
    if (user.email) {
      const vCardContact = buildVCardFromShareBackContact(contactData);
      const vCardFileName = buildVCardFileName('', contactData);

      await sendTemplateEmail({
        templateId: 'd-edcdee049b6d468cadf3ce7098bf0fe2',
        recipients: [
          {
            to: user.email,
            dynamicTemplateData: {
              subject: 'You received a new contact through azzapp.',
              title: 'You have a new contact',
              body: "You've received a new contact directly accessible on azzapp. Alternatively, you can also open and save the attached contact file.",
            },
          },
        ],
        attachments: [
          {
            content: Buffer.from(vCardContact.toString()).toString('base64'),
            filename: vCardFileName,
            disposition: 'attachment',
          },
        ],
      });
    }

    return NextResponse.json(
      { success: true, message: 'Shareback processed successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
