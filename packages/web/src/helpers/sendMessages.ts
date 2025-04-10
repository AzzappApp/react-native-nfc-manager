import * as Sentry from '@sentry/nextjs';
import sanitizeHTML from 'sanitize-html';
import { getMediasByIds, type Profile, type WebCard } from '@azzapp/data';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import { serializeContactCard } from '@azzapp/shared/contactCardHelpers';
import { sendEmail, sendTemplateEmail } from '@azzapp/shared/emailHelpers';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import {
  buildInviteUrl,
  buildUserUrlWithContactCard,
} from '@azzapp/shared/urlHelpers';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';
import { getServerIntl } from './i18nHelpers';
import { sendTwilioSMS } from './twilioHelpers';
import type { Locale } from '@azzapp/i18n';
import type { VCardAdditionnalData } from '@azzapp/shared/vCardHelpers';

const buildWebcardUrl = async (profile: Profile, webCard: WebCard) => {
  const { data, signature } = await serializeAndSignContactCard(
    webCard?.userName ?? '',
    profile.id,
    profile.webCardId,
    profile.contactCard ?? {},
    webCard.isMultiUser ? webCard?.commonInformation : null,
  );

  const url = buildUserUrlWithContactCard(
    webCard?.userName ?? '',
    data,
    signature,
  );

  return url;
};

type Parameters = {
  profile?: Profile;
  contact?: {
    firstname: string;
    lastname: string;
  };
};

export const notifyUsers = async (
  receiversType: 'email' | 'phone',
  receivers: string[],
  webCard: WebCard,
  notificationType: 'invitation' | 'transferOwnership' | 'vcard',
  locale: Locale,
  parameters?: Parameters,
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

    case 'vcard':
      switch (receiversType) {
        case 'email': {
          const profile = parameters?.profile;
          const contact = parameters?.contact;
          if (profile && webCard && contact) {
            const profileName = formatDisplayName(
              profile.contactCard?.firstName,
              profile.contactCard?.lastName,
            );
            const companyName =
              webCard.commonInformation?.company ??
              profile.contactCard?.company;

            const additionalData: VCardAdditionnalData = {
              urls: (webCard.commonInformation?.urls ?? [])?.concat(
                profile.contactCard?.urls ?? [],
              ),
              socials: (webCard.commonInformation?.socials ?? [])?.concat(
                profile.contactCard?.socials ?? [],
              ),
            };

            const avatarUrl = await buildAvatarUrl(
              profile,
              webCard,
              false,
              false,
            );
            if (avatarUrl) {
              const data = await fetch(avatarUrl);
              const blob = await data.arrayBuffer();
              const base64 = Buffer.from(blob).toString('base64');

              additionalData.avatar = {
                type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
                base64,
              };
            }
            const vCard = await buildVCardFromSerializedContact(
              webCard.userName,
              serializeContactCard(
                profile.id,
                webCard.id,
                profile.contactCard,
                webCard.commonInformation,
              ),
              additionalData,
            );

            const cover = webCard.coverMediaId
              ? await getMediasByIds([webCard.coverMediaId])
              : null;
            const coverUrl = cover?.[0]
              ? cover?.[0].kind === 'image'
                ? getImageURLForSize({
                    id: cover?.[0]?.id,
                    width: 200,
                    height: 320,
                    previewPositionPercentage:
                      webCard.coverPreviewPositionPercentage,
                  })
                : getVideoThumbnailURL({
                    id: cover?.[0]?.id,
                    width: 200,
                    height: 320,
                    previewPositionPercentage:
                      webCard.coverPreviewPositionPercentage,
                  })
              : '';

            const webCardUrl = await buildWebcardUrl(profile, webCard);
            const vcardName =
              formatDisplayName(
                profile.contactCard?.firstName,
                profile.contactCard?.lastName,
                companyName,
              ) || 'vcard';

            await sendTemplateEmail({
              templateId: 'd-6bec7b2457764066a531ecb66793e4c1',
              attachments: vCard
                ? [
                    {
                      content: Buffer.from(vCard.vCard.toString()).toString(
                        'base64',
                      ),
                      filename: `${vcardName}.vcf`,
                      disposition: 'attachment',
                    },
                  ]
                : [],
              recipients: receivers.map(receiver => ({
                to: receiver,
                dynamicTemplateData: {
                  subject: intl.formatMessage(
                    {
                      defaultMessage: '{username}’s Contact Details',
                      id: 'LC/eid',
                      description: 'Email title for add contact notification',
                    },
                    {
                      username: profileName,
                    },
                  ),
                  title: intl.formatMessage(
                    {
                      defaultMessage:
                        '{username} has shared contact details with you.',
                      id: 'AsJ0+b',
                      description: 'Email title for add contact notification',
                    },
                    {
                      username: profileName,
                    },
                  ),
                  avatarUrl,
                  name: profileName,
                  jobTitle: profile.contactCard?.title,
                  company: companyName,
                  hello: intl.formatMessage(
                    {
                      defaultMessage: 'Hi {name}',
                      id: '8QTQo3',
                      description: 'Email hello for add contact notification',
                    },
                    {
                      name: contact.firstname,
                    },
                  ),
                  content: intl.formatMessage(
                    {
                      defaultMessage:
                        "Please open the <b>attached contact file</b> to save <b>{username}'s details</b>, or open the link below.",
                      id: 'Oe0aFY',
                      description: 'Email content for add contact notification',
                    },
                    {
                      b: (...chunks) => `<b>${chunks}</b>`,
                      username: profileName,
                    },
                  ),
                  coverUrl,
                  webCardUrl,
                  openContact: intl.formatMessage(
                    {
                      defaultMessage: "Open {name}'s Contact",
                      id: '4hZb27',
                      description: 'open contact for add contact notification',
                    },
                    { name: profileName },
                  ),
                  getAzzapp: intl.formatMessage(
                    {
                      defaultMessage:
                        '<b>Get azzapp now for free to create your own digital business card in seconds.</b>',
                      id: 'HabKRZ',
                      description: 'get azzapp for add contact notification',
                    },
                    {
                      b: (...chunks) => `<b>${chunks}</b>`,
                    },
                  ),
                  azzappPresentation: intl.formatMessage({
                    defaultMessage:
                      'Azzapp: The Smarter Way to Share Your Digital Business Card Instantly.',
                    id: 'tzwvWt',
                    description:
                      'azzapp presentation for add contact notification',
                  }),
                  networking: intl.formatMessage({
                    defaultMessage:
                      'Elevate your networking experience with ease and sustainability:',
                    id: 'S86nJJ',
                    description: 'networking for add contact notification',
                  }),
                  sharing: intl.formatMessage(
                    {
                      defaultMessage:
                        '<b>Instant Contact Sharing:</b> Exchange details in seconds.',
                      id: 'NmMnGF',
                      description: 'sharing for add contact notification',
                    },
                    {
                      b: (...chunks) => `<b>${chunks}</b>`,
                    },
                  ),
                  connection: intl.formatMessage(
                    {
                      defaultMessage:
                        '<b>Seamless Connections:</b> Receive contact information effortlessly.',
                      id: 'yaZXcv',
                      description: 'connection for add contact notification',
                    },
                    {
                      b: (...chunks) => `<b>${chunks}</b>`,
                    },
                  ),
                  paperless: intl.formatMessage(
                    {
                      defaultMessage:
                        '<b>Go Paperless:</b> Say goodbye to outdated paper business cards.',
                      id: 'iJxBCm',
                      description: 'paperless for add contact notification',
                    },
                    {
                      b: (...chunks) => `<b>${chunks}</b>`,
                    },
                  ),
                  ecofriendly: intl.formatMessage(
                    {
                      defaultMessage:
                        '<b>Eco-Friendly Networking:</b> Make a positive impact on the planet while you connect.',
                      id: 'HD3Qyd',
                      description: 'ecofriendly for add contact notification',
                    },
                    {
                      b: (...chunks) => `<b>${chunks}</b>`,
                    },
                  ),
                  join: intl.formatMessage({
                    defaultMessage:
                      'Join Now and Network More Efficiently Than Ever Before!',
                    id: 'WNUebq',
                    description: 'join for add contact notification',
                  }),
                  unlock: intl.formatMessage({
                    defaultMessage:
                      'Unlock smarter, faster connections and redefine your networking experience.',
                    id: 'lt+MaO',
                    description: 'unlock for add contact notification',
                  }),
                  discover: intl.formatMessage({
                    defaultMessage: 'Discover more at',
                    id: 'HO2BMC',
                    description: 'discover for add contact notification',
                  }),
                  azzappUrl: process.env.NEXT_PUBLIC_URL,
                  year: intl.formatMessage({
                    defaultMessage: '2025',
                    id: '7mxm1W',
                    description: 'year for add contact notification',
                  }),
                },
              })),
            });
          }

          break;
        }
      }
  }
};
