import sanitizeHTML from 'sanitize-html';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';
import { getServerIntl } from './i18nHelpers';
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
          {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendMail`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                },
                body: JSON.stringify(
                  receivers.map(email => ({
                    email,
                    subject: intl.formatMessage(
                      {
                        id: 'rd2Dwi',
                        defaultMessage:
                          'You have been invited to join {userName}',
                        description: 'Email subject for invitation',
                      },
                      {
                        userName: webCard.userName,
                      },
                    ),
                    text: intl.formatMessage(
                      {
                        id: 'GJ+mGa',
                        defaultMessage:
                          'You have been invited to join {userName} on Azzapp! Download the app and sign up with this email to join: {email}',
                        description: 'Email body for invitation',
                      },
                      {
                        userName: webCard.userName,
                        email,
                      },
                    ),
                    html: intl.formatMessage(
                      {
                        id: '7atUAM',
                        defaultMessage: `<div>You have been invited to join {userName} on Azzapp! Download the app and sign up with this email to join: {email}</div>`,
                        description: 'Email body for invitation',
                      },
                      {
                        div: (...chunks) =>
                          sanitizeHTML(`<div>${chunks.join('')}</div>`),
                        userName: webCard.userName,
                        email,
                      },
                    ),
                  })),
                ),
              },
            );

            if (!res.ok) {
              throw new Error('Error sending emails');
            }
          }
          break;
        case 'phone':
          await Promise.allSettled(
            receivers.map(async receiver => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendSms`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                  },
                  body: JSON.stringify({
                    phoneNumber: receiver,
                    body: intl.formatMessage(
                      {
                        id: 'hDxoUl',
                        defaultMessage: `You have been invited to join {userName} on Azzapp! Download the app and sign up with this phone number to join: {phoneNumber}`,
                        description: 'SMS body for invitation',
                      },
                      {
                        userName: webCard.userName,
                        phoneNumber: receiver,
                      },
                    ),
                  }),
                },
              );

              if (!res.ok) {
                throw new Error('Error sending sms');
              }
            }),
          );

          break;
      }
      break;

    case 'transferOwnership':
      switch (receiversType) {
        case 'email':
          {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendMail`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                },
                body: JSON.stringify(
                  receivers.map(email => ({
                    email,
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
                  })),
                ),
              },
            );

            if (!res.ok) {
              throw new Error('Error sending emails');
            }
          }

          break;
        case 'phone':
          for (const receiver of receivers) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sendSms`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                },
                body: JSON.stringify({
                  phoneNumber: receiver,
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
                }),
              },
            );

            if (!res.ok) {
              throw new Error('Error sending sms');
            }
          }
          break;
      }

      break;
  }
};
