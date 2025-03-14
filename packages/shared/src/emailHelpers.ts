export const SUPPORT_EMAIL = 'support@azzapp.com';

const SEND_GRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRIP_NOREPLY_SENDER = process.env.SENDGRIP_NOREPLY_SENDER!;

export type EmailAttachment = {
  content: string;
  filename: string;
  type?: 'image/gif' | 'image/jpeg' | 'image/png' | 'text/html' | 'text/plain';
} & (
  | { disposition: 'attachment'; contentId?: never }
  | { disposition: 'inline'; contentId: string }
);

/**
 * Sends emails to specified recipients.
 *
 * @param {Array<{email: string, subject: string, text: string, html: string, attachments?: EmailAttachment[]}>} contacts An array of objects containing details for each email to be sent. Each object must include: `email` for the recipient's email address, `subject` for the email's subject, `text` for plain text content, `html` for HTML content, and an optional `attachments` field for any attachments.
 * @returns {Promise<void>} A promise that resolves when all emails have been successfully sent, or rejects in case of an error.
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string[] | string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
}) => {
  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SEND_GRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        { to: (Array.isArray(to) ? to : [to]).map(email => ({ email })) },
      ],
      from: { email: SENDGRIP_NOREPLY_SENDER, name: 'azzapp' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
      attachments: attachments?.map(attachment => ({
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type ?? 'text/plain',
        disposition: attachment.disposition,
        content_id: attachment.contentId,
      })),
    }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to send email: ${await resp.text()}`);
  }
};

export const sendTemplateEmail = async <T extends Record<string, unknown>>({
  recipients,
  templateId,
  attachments,
}: {
  recipients: Array<{
    to: string;
    dynamicTemplateData: T;
  }>;
  templateId: string;
  attachments?: EmailAttachment[];
}) => {
  const rep = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SEND_GRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: recipients.map(({ to, dynamicTemplateData }) => ({
        to: [{ email: to }],
        dynamic_template_data: dynamicTemplateData,
      })),
      from: { email: SENDGRIP_NOREPLY_SENDER, name: 'azzapp' },
      template_id: templateId,
      attachments: attachments?.map(attachment => ({
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type ?? 'text/plain',
        disposition: attachment.disposition,
        content_id: attachment.contentId,
      })),
    }),
  });

  if (!rep.ok) {
    throw new Error(`Failed to send email: ${await rep.text()}`);
  }
};
