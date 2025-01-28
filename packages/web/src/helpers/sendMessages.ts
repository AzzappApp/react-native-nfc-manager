import * as Sentry from '@sentry/nextjs';
import sanitizeHTML from 'sanitize-html';
import { buildInviteUrl } from '@azzapp/shared/urlHelpers';
import { sendEmail, sendTemplateEmail } from './emailHelpers';
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
  if (!webCard.userName) {
    Sentry.captureMessage('cannot notify user without username');
    return;
  }
  const intl = getServerIntl(locale);
  switch (notificationType) {
    case 'invitation':
      switch (receiversType) {
        case 'email':
          await sendTemplateEmail({
            templateId: 'd-62d0fa44557042c78392ba195daef109',
            recipients: receivers.map(receiver => ({
              to: receiver,
              dynamicTemplateData: {
                title: intl.formatMessage(
                  {
                    defaultMessage:
                      'You have been invited to join "{username}" on azzapp',
                    id: 'wDb2W4',
                    description: 'Email title for multi-user invitation',
                  },
                  {
                    username: webCard.userName,
                  },
                ),
                join: intl.formatMessage(
                  {
                    defaultMessage:
                      'To join, download the app and sign up using "{email}"',
                    id: 'L+W7H3',
                    description: 'Email body for multi-user invitation',
                  },
                  {
                    email: receiver,
                  },
                ),
                presentation: intl.formatMessage({
                  defaultMessage:
                    'azzapp is a mobile app for Digital Business Cards that helps you:',
                  id: 'HL9OPB',
                  description:
                    'Email body for multi-user invitation - presentation',
                }),
                key1: intl.formatMessage({
                  defaultMessage: 'Enhance your networking effortlessly',
                  id: 'gAqwpA',
                  description:
                    'Email body for multi-user invitation - feature 1',
                }),
                key2: intl.formatMessage({
                  defaultMessage: 'Instantly exchange contact details',
                  id: 'vgRug2',
                  description:
                    'Email body for multiuser invitation - feature 2',
                }),
                key3: intl.formatMessage({
                  defaultMessage: 'Receive contact information in return',
                  id: 'ss0cnZ',
                  description:
                    'Email body for multiuser invitation - feature 3',
                }),
                key4: intl.formatMessage({
                  defaultMessage: 'Eliminate the need for physical cards',
                  id: '+tUpvc',
                  description:
                    'Email body for multi-user invitation - feature 4',
                }),
                key5: intl.formatMessage({
                  defaultMessage: 'Contribute to a greener future',
                  id: 'bUo006',
                  description:
                    'Email body for multi-user invitation - feature 5',
                }),
                download: intl.formatMessage({
                  defaultMessage: 'Download the application',
                  id: '+EIfOg',
                  description:
                    'Email body for multi-user invitation - download',
                }),
                discover: intl.formatMessage({
                  defaultMessage:
                    'Discover more about this innovative solution at',
                  id: 'tWB0FS',
                  description:
                    'Email body for multi-user invitation - discover',
                }),
                see: intl.formatMessage(
                  {
                    defaultMessage: 'and see why "{username}" chose azzapp!',
                    id: '0wx+cg',
                    description: 'Email body for multi-user invitation - see',
                  },
                  {
                    username: webCard.userName,
                  },
                ),
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
              },
            })),
          });

          break;
        case 'phone':
          await Promise.all(
            receivers.map(async receiver => {
              await sendTwilioSMS({
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
                    url: buildInviteUrl(webCard.userName || ''),
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
