import sanitizeHTML from 'sanitize-html';
import { buildInviteUrl } from '@azzapp/shared/urlHelpers';
import { sendEmail } from './emailHelpers';
import { getServerIntl } from './i18nHelpers';
import { sendTwilioSMS } from './twilioHelpers';
import type { WebCard } from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';

export const notifyUsers = async (
  receiversType: 'email' | 'phone',
  receivers: string[],
  webCard: WebCard,
  notificationType: 'invitation' | 'transferOwnership',
  locale: Locale,
) => {
  const intl = getServerIntl(locale);
  switch (notificationType) {
    case 'invitation':
      switch (receiversType) {
        case 'email':
          await sendEmail({
            to: receivers,
            subject: intl.formatMessage(
              {
                id: 'rd2Dwi',
                defaultMessage: 'You have been invited to join {userName}',
                description: 'Email subject for invitation',
              },
              {
                userName: webCard.userName,
              },
            ),
            text: intl.formatMessage(
              {
                id: 'p3Wm44',
                defaultMessage:
                  'You have been invited to join {userName} on Azzapp! Download the app {url} and sign up with this email to join: {email}',
                description: 'Email body for invitation',
              },
              {
                userName: webCard.userName,
                email: receivers.join(', '),
                url: buildInviteUrl(webCard.userName),
              },
            ),
            html: intl.formatMessage(
              {
                id: 'x4Spsz',
                defaultMessage: `<div>You have been invited to join {userName} on Azzapp! <a>Download</a> the app and sign up with this email to join: {email}</div>`,
                description: 'Email body for invitation',
              },
              {
                div: (...chunks) =>
                  sanitizeHTML(`<div>${chunks.join('')}</div>`),
                userName: webCard.userName,
                email: receivers.join(', '),
                a: (...chunks) =>
                  sanitizeHTML(
                    `<a href="${buildInviteUrl(webCard.userName)}">${chunks.join('')}</a>`,
                  ),
              },
            ),
          });
          break;
        case 'phone':
          await Promise.all(
            receivers.map(async receiver => {
              sendTwilioSMS({
                to: receiver,
                body: intl.formatMessage(
                  {
                    id: 'poAqAV',
                    defaultMessage: `You have been invited to join {userName} on Azzapp! Download the app {url} and sign up with this phone number to join: {phoneNumber}`,
                    description: 'SMS body for invitation',
                  },
                  {
                    userName: webCard.userName,
                    phoneNumber: receiver,
                    url: buildInviteUrl(webCard.userName),
                  },
                ),
              }).catch(error => {
                console.warn('Error sending SMS', error);
              });
            }),
          );

          break;
      }
      break;

    case 'transferOwnership':
      switch (receiversType) {
        case 'email':
          await sendEmail({
            to: receivers[0],
            subject: intl.formatMessage({
              id: 'gbGghz',
              defaultMessage: 'WebCard ownership transfer invitation.',
              description: 'Email subject for ownership transfer',
            }),
            text: intl.formatMessage(
              {
                defaultMessage: `Dear user, you are invited to take over the ownership of {userName}. You can accept or decline the invitation from the app home page.`,
                id: '+QL2kI',
                description: 'Email body for ownership transfer',
              },
              {
                userName: webCard.userName,
              },
            ),
            html: intl.formatMessage(
              {
                defaultMessage: `<div>Dear user, you are invited to take over the ownership of {userName}. You can accept or decline the invitation from the app home page.</div>`,
                id: '5t2gDd',
                description: 'Email body for ownership transfer',
              },
              {
                div: (...chunks) =>
                  sanitizeHTML(`<div>${chunks.join('')}</div>`),
                userName: webCard.userName,
              },
            ),
          });

          break;
        case 'phone':
          await sendTwilioSMS({
            to: receivers[0],
            body: intl.formatMessage(
              {
                defaultMessage: `Dear user, you are invited to take over the ownership of {userName}. You can accept or decline the invitation from the app home page.`,
                id: 'uBAvQ1',
                description: 'SMS body for ownership transfer',
              },
              {
                userName: webCard.userName,
              },
            ),
          });
      }
      break;
  }
};
