'use server';

import { parseWithZod } from '@conform-to/zod';
import * as Sentry from '@sentry/nextjs';
import { jwtDecode } from 'jwt-decode';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { compressToEncodedURIComponent } from 'lz-string';
import { headers } from 'next/headers';
import {
  getProfileByUserAndWebCard,
  getUserById,
  saveShareBack,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import { buildVCardFromShareBackContact } from '@azzapp/shared/vCardHelpers';
import { ShareBackFormSchema } from '#components/ShareBackModal/shareBackFormSchema';
import {
  CONTACT_METHODS,
  getPreferredContactMethod,
} from '#helpers/contactMethodsHelpers';
import { sendEmail } from '#helpers/emailHelpers';
import { getServerIntl } from '#helpers/i18nHelpers';
import { sendPushNotification } from '#helpers/notificationsHelpers';
import {
  getValuesFromSubmitData,
  shareBackSignature,
  shareBackVCardFilename,
} from '#helpers/shareBackHelper';
import { sendTwilioSMS } from '#helpers/twilioHelpers';
import type { EmailAttachment } from '#helpers/emailHelpers';
import type { NewSharedContact } from '@azzapp/data';
import type { SubmissionResult } from '@conform-to/react';
import type { JwtPayload } from 'jwt-decode';
import type { CountryCode } from 'libphonenumber-js';

export type ShareBackFormData = FormData & {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  phone: {
    number: string;
    countryCode: string;
  };
  email: string;
};

const intl = getServerIntl();

export const processShareBackSubmission = async (
  userId: string,
  webcardId: string,
  token: string,
  prevState: unknown,
  formData: FormData,
): Promise<SubmissionResult | null | undefined> => {
  headers();

  const submission = parseWithZod(formData as ShareBackFormData, {
    schema: ShareBackFormSchema,
  });

  try {
    // decode token
    const decodedToken = jwtDecode<JwtPayload>(token);
    // verify expiration date
    if (!decodedToken.exp || decodedToken.exp < Date.now() / 1000) {
      return submission.reply({
        formErrors: [
          intl.formatMessage({
            defaultMessage:
              'Oops, something went wrong, please refresh the page.',
            id: 'l3KPmc',
            description: 'ShareBack - Error message for expired token',
          }),
        ],
      });
    }

    if (submission.status !== 'success') {
      return submission.reply({
        formErrors: [
          intl.formatMessage({
            defaultMessage:
              'Your submission has errors, please check the form and try again.',
            id: 'heLjo+',
            description: 'ShareBack - Error message for invalid submission',
          }),
        ],
      });
    }
    // get user data from userId
    const user = await getUserById(userId);

    if (!user) {
      Sentry.captureException(
        new Error(
          `No user found to send the share back with userId: ${userId} from token: ${token}`,
        ),
      );

      return submission.reply({
        formErrors: ['Contact not found'],
      });
    }

    const profile = await getProfileByUserAndWebCard(user.id, webcardId);
    if (!profile) {
      Sentry.captureException(
        new Error(
          `No profile found to send the share back with userId: ${userId} and webCardId: ${webcardId}`,
        ),
      );

      return submission.reply({
        formErrors: ['Profile not found'],
      });
    }

    const userParamsContactMethods = {
      email: user.email,
      phoneNumber: user.phoneNumber,
      emailConfirmed: user.emailConfirmed,
      phoneNumberConfirmed: user.phoneNumberConfirmed,
    };

    const contactMethod = getPreferredContactMethod(userParamsContactMethods);

    if (!contactMethod) {
      Sentry.captureException(
        new Error(
          `No contact method found to send the share back: ${JSON.stringify(userParamsContactMethods)}`,
        ),
      );

      return submission.reply({
        formErrors: ['No contact method found to send the share back'],
      });
    }

    // @todo: wording for contact share back message
    const shareBackBody = intl.formatMessage({
      id: 'dMfROA',
      defaultMessage: `Hello, You've received a new contact ShareBack. Best.`,
      description: 'Email body for new contact share back',
    });

    let phone = submission.value.phone?.number || '';

    try {
      const { number } = parsePhoneNumberWithError(
        submission.value.phone?.number || '',
        {
          defaultCountry: submission.value.phone?.countryCode as CountryCode,
        },
      );
      phone = number;
    } catch (e) {
      Sentry.captureException(e);
    }

    const contactFormValue: NewSharedContact = {
      ...(submission.payload as NewSharedContact),
      phone,
    };

    await saveShareBack(profile.id, contactFormValue);

    await sendPushNotification(profile.userId, {
      type: 'shareBack',
      mediaId: null,
      sound: 'default',
      deepLink: 'shareBack',
      locale: guessLocale(user?.locale),
    });

    if (contactMethod.method === CONTACT_METHODS.SMS) {
      const shareBackContactDetails = getValuesFromSubmitData(contactFormValue);

      const signature = await shareBackSignature(
        process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
        shareBackContactDetails,
      );

      const shareBackContactCompressedData = compressToEncodedURIComponent(
        JSON.stringify([shareBackContactDetails, signature]),
      );

      const shareBackContactVCardUrl = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/shareBackVCard?c=${shareBackContactCompressedData}`;
      await sendTwilioSMS({
        body: shareBackBody,
        to: user.phoneNumber as string,
        mediaUrl: shareBackContactVCardUrl,
      });
    } else {
      const buildVCardContact =
        buildVCardFromShareBackContact(contactFormValue);

      const vCardFileName = shareBackVCardFilename(submission.value);

      const shareBackContactVCardAttachment = {
        content: Buffer.from(buildVCardContact.toString()).toString('base64'),
        filename: vCardFileName,
        disposition: 'attachment',
      } as EmailAttachment;

      // @todo: wording for title email share back
      await sendEmail({
        to: user.email as string,
        subject: intl.formatMessage({
          id: 'ivEKQ2',
          defaultMessage: 'New Contact ShareBack Received',
          description: 'Email subject for new contact share back received',
        }),
        text: shareBackBody,
        html: shareBackBody,
        attachments: [shareBackContactVCardAttachment],
      });
    }

    return submission.reply({
      formErrors: [],
    });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return submission.reply({
      formErrors: ['An error occurred while sending the share back'],
    });
  }
};
