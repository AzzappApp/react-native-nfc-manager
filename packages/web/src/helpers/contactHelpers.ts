export const AZZAPP_SERVER_HEADER = 'azzapp-server-auth';
import sgMail from '@sendgrid/mail';
import * as Sentry from '@sentry/nextjs';
import {
  TWILIO_PHONE_NUMBER,
  twilioMessagesService,
} from '#helpers/twilioHelpers';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const SENDGRIP_NOREPLY_SENDER = process.env.SENDGRIP_NOREPLY_SENDER!;

export type EmailAttachment = {
  content: string;
  filename: string;
  type?: 'text/html' | 'text/plain';
} & (
  | { disposition: 'attachment'; contentId?: never }
  | { disposition: 'inline'; contentId: string }
);

export type SMSAttachment = string;

/**
 * Sends emails to specified recipients.
 *
 * @param {Array<{email: string, subject: string, text: string, html: string, attachments?: EmailAttachment[]}>} contacts An array of objects containing details for each email to be sent. Each object must include: `email` for the recipient's email address, `subject` for the email's subject, `text` for plain text content, `html` for HTML content, and an optional `attachments` field for any attachments.
 * @returns {Promise<void>} A promise that resolves when all emails have been successfully sent, or rejects in case of an error.
 */
async function sendEmail(
  contacts: Array<{
    email: string;
    subject: string;
    text: string;
    html: string;
    attachments?: EmailAttachment[];
  }>,
): Promise<void> {
  try {
    await sgMail.send(
      contacts.map(msg => ({
        to: msg.email,
        from: SENDGRIP_NOREPLY_SENDER, // Change to your verified sender
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        attachments: msg.attachments?.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type ?? 'text/plain',
          disposition: attachment.disposition,
          content_id: attachment.contentId,
        })),
      })),
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}

/**
 * Sends SMS messages to specified recipients.
 *
 * @param {Array<{phoneNumber: string, body: string, mediaUrl?: string[]}>} contacts An array of objects, each representing a message to be sent to a recipient. Each object includes: `phoneNumber` for the recipient's phone number, `body` for the text message to be sent, and an optional `mediaUrl` array for URLs to media content (images, videos, etc.) to be sent as MMS.
 * @returns {Promise<void>} A promise that resolves when all SMS messages have been sent successfully, or rejects in case of an error.
 */
async function sendSMS(
  contacts: Array<{
    phoneNumber: string;
    body: string;
    mediaUrl?: string[];
  }>,
): Promise<void> {
  try {
    await Promise.all(
      contacts.map(contact =>
        twilioMessagesService().create({
          body: contact.body,
          to: contact.phoneNumber,
          from: TWILIO_PHONE_NUMBER,
          mediaUrl: contact.mediaUrl ? contact.mediaUrl : undefined,
        }),
      ),
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}

export { sendEmail, sendSMS };
