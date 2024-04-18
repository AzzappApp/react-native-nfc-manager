'use server';

import { parseWithZod } from '@conform-to/zod';
import * as Sentry from '@sentry/nextjs';
import { jwtDecode } from 'jwt-decode';
import { compressToEncodedURIComponent } from 'lz-string';
import { headers } from 'next/headers';
import { getUserById } from '@azzapp/data';
import { buildVCardFromShareBackContact } from '@azzapp/shared/vCardHelpers';
import { ShareBackFormSchema } from '#components/ShareBackModal/shareBackFormSchema';
import { sendSMS, sendEmail } from '#helpers/contactHelpers';
import {
  CONTACT_METHODS,
  getPreferredContactMethod,
} from '#helpers/contactMethodsHelpers';
import {
  getValuesFromSubmitData,
  shareBackSignature,
} from '#helpers/shareBackHelper';
import type { EmailAttachment } from '#helpers/contactHelpers';
import type { SubmissionResult } from '@conform-to/react';
import type { JwtPayload } from 'jwt-decode';

export type ShareBackFormData = FormData & {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
};

export const processShareBackSubmission = async (
  userId: string,
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
        formErrors: ['Token expired, please refresh and try sharing again'],
      });
    }

    if (submission.status !== 'success') {
      return submission.reply({
        formErrors: ['Share back form is not valid'],
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
    const shareBackBody = `Hello,

    You've received a new contact ShareBack.

    Best.`;

    if (contactMethod.method === CONTACT_METHODS.SMS) {
      const shareBackContactDetails = getValuesFromSubmitData(
        submission.payload,
      );

      const signature = await shareBackSignature(
        process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
        shareBackContactDetails,
      );

      const shareBackContactCompressedData = compressToEncodedURIComponent(
        JSON.stringify([shareBackContactDetails, signature]),
      );

      const shareBackContactVCardUrl = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/shareBackVCard?c=${shareBackContactCompressedData}`;

      await sendSMS([
        {
          phoneNumber: user.phoneNumber as string,
          body: shareBackBody,
          mediaUrl: [shareBackContactVCardUrl],
        },
      ]);
    } else {
      const buildVCardContact = buildVCardFromShareBackContact(
        submission.payload,
      );

      // @todo: wording for filename vcf
      const shareBackContactVCardAttachment = {
        content: Buffer.from(buildVCardContact.toString()).toString('base64'),
        filename: 'azzapp-contact.vcf',
        disposition: 'attachment',
      } as EmailAttachment;

      // @todo: wording for title email share back
      await sendEmail([
        {
          email: user.email as string,
          subject: 'New Contact ShareBack Received',
          text: shareBackBody,
          html: shareBackBody,
          attachments: [shareBackContactVCardAttachment],
        },
      ]);
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
