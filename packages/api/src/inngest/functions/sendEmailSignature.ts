import {
  getProfileWithWebCardById,
  getUserById,
  getActiveContactCardAccess,
} from '@azzapp/data';
import { DEFAULT_LOCALE, isSupportedLocale } from '@azzapp/i18n';
import { sendTemplateEmail } from '@azzapp/service/emailServices';
import {
  serializeAndSignEmailSignature,
  serializeAndSignEmailSignatureLinkParams,
} from '@azzapp/service/emailSignatureServices';
import { createServerIntl } from '@azzapp/service/i18nServices';
import {
  buildAvatarUrl,
  buildBannerUrl,
  buildLogoUrl,
} from '@azzapp/service/mediaServices/mediaServices';
import { getEmailSignatureTitleColor } from '@azzapp/shared/colorsHelpers';
import {
  buildEmailSignatureGenerationUrl,
  buildEmailSignatureGenerationUrlWithKey,
} from '@azzapp/shared/urlHelpers';
import { inngest } from '../client';
import type { Profile, WebCard } from '@azzapp/data';
import type { IntlShape } from '@formatjs/intl';

export const sendEmailSignatureBatch = inngest.createFunction(
  { id: 'emailSignatureBatch' },
  { event: 'batch/emailSignature' },
  async ({ event, step }) => {
    const profileIds = event.data.profileIds;

    for (const profileId of profileIds) {
      await step.sendEvent(`send-email-${profileId}`, {
        name: 'send/emailSignature',
        data: {
          profileId,
        },
      });
    }

    return { queued: profileIds.length };
  },
);

export const sendEmailSignature = inngest.createFunction(
  { id: 'emailSignature' },
  { event: 'send/emailSignature' },
  async ({ event }) => {
    const { profileId, deviceId, key } = event.data;

    const res = await getProfileWithWebCardById(profileId);
    if (res) {
      const { profile, webCard } = res;
      const user = await getUserById(profile.userId);
      const locale = isSupportedLocale(user?.locale)
        ? user?.locale
        : DEFAULT_LOCALE;
      const url = await generateEmailSignature({
        profile,
        webCard,
        intl: createServerIntl(locale),
        deviceId,
        key,
      });

      return { sent: true, url };
    }

    return { sent: false };
  },
);

const IMAGE_AVATAR_LOGO_WIDTH = 180;

const generateEmailSignature = async ({
  webCard,
  profile,
  intl,
  deviceId,
  key,
}: {
  webCard: WebCard;
  profile: Profile;
  intl: IntlShape;
  deviceId?: string;
  key?: string;
}) => {
  if (!webCard.userName) {
    throw new Error('User name is required');
  }

  if (!profile.contactCard) {
    throw new Error('Contact card is required');
  }

  const avatarUrl = await buildAvatarUrl(
    profile,
    null,
    false,
    false,
    IMAGE_AVATAR_LOGO_WIDTH,
  );
  const logoUrl = await buildLogoUrl(profile, webCard, IMAGE_AVATAR_LOGO_WIDTH);

  const bannerUrl = await buildBannerUrl(profile, webCard);

  let contactCardAccess;
  let linkUrl;

  if (deviceId && key) {
    contactCardAccess = await getActiveContactCardAccess(deviceId, profile.id);

    if (contactCardAccess) {
      const { serialized, signature } =
        await serializeAndSignEmailSignatureLinkParams(
          webCard.userName,
          contactCardAccess.id,
          key,
        );

      linkUrl = buildEmailSignatureGenerationUrlWithKey(
        webCard.userName,
        serialized,
        signature,
      );
    }
  }

  if (!linkUrl) {
    const { data, signature } = await serializeAndSignEmailSignature(
      webCard.userName,
      profile.id,
      webCard.id,
      profile.contactCard,
      webCard.isMultiUser ? webCard.commonInformation : undefined,
      avatarUrl,
    );

    linkUrl = buildEmailSignatureGenerationUrl(
      webCard.userName,
      data,
      signature,
    );
  }

  const user = await getUserById(profile.userId);

  if (user?.email) {
    await sendTemplateEmail({
      templateId: 'd-64a113c41c1d43068723b4aeefac3d97',
      recipients: [
        {
          to: user.email,
          dynamicTemplateData: {
            avatarUrl,
            logoUrl,
            bannerUrl,
            name: `${profile.contactCard.firstName ?? ''} ${profile.contactCard.lastName ?? ''}`.trim(),
            jobTitle: profile.contactCard.title,
            company: webCard.isMultiUser
              ? (webCard.commonInformation?.company ??
                profile.contactCard.company)
              : profile.contactCard.company,
            saveMyContact: intl.formatMessage({
              defaultMessage: 'Save my Contact',
              id: 'dh7bIi',
              description: 'Save my Contact link in the email signature',
            }),
            phoneNumbers: (webCard.isMultiUser
              ? (webCard.commonInformation?.phoneNumbers ?? [])
              : []
            ).concat(profile.contactCard.phoneNumbers ?? []),
            emails: (webCard.isMultiUser
              ? (webCard.commonInformation?.emails ?? [])
              : []
            ).concat(profile.contactCard.emails ?? []),
            linkUrl,
            subject: intl.formatMessage({
              defaultMessage: 'Elevate your email signature',
              id: 'QtojF4',
              description:
                'Subject of the email sent to the user when generating an email signature',
            }),
            title: intl.formatMessage({
              defaultMessage: 'Elevate Your Email Signature 🚀',
              id: 'Adde1V',
              description:
                'Title of the email sent to the user when generating an email signature',
            }),
            titleColor: getEmailSignatureTitleColor(
              webCard.cardColors?.primary,
            ),
            hello: intl.formatMessage({
              defaultMessage: `Hello,<br/>
<br/>
We hope this email finds you well! At azzapp, we're always looking for ways to help you make a lasting impression, and your email signature is no exception. We believe that a professional and engaging signature speaks volumes about you and your business.<br/>
<br/>
That's why we're excited to introduce two fantastic ways for you to enhance your email signature effortlessly:`,
              id: 'UKonCS',
              description: 'Introduction of email signature',
            }),
            option1: intl.formatMessage({
              defaultMessage: 'Option 1: Add a "Save my Contact" link',
              id: 'c/xCvC',
              description:
                'Option 1: Add a "Save my Contact" link to your email signature',
            }),
            option1Step1: intl.formatMessage({
              defaultMessage:
                'If you already have a signature and wish to give it a modern twist, you can easily add a "Save my Contact" link. This feature allows your recipients to save your contact information with a single click.',
              id: 'hltepR',
              description:
                'Content of the option 1: If you are happy with your email signature ',
            }),
            option1Step2: intl.formatMessage({
              defaultMessage:
                'Simply tap on the button below to open the step-by-step instructions on how to seamlessly integrate this button into your existing signature.',
              id: '4g8ME3',
              description:
                'Content of the option 1: Simply tap on the button below',
            }),
            option1Action: intl.formatMessage({
              defaultMessage: 'Add “Save my Contact” link',
              id: 'ZfySEL',
              description:
                'Action button to add "Save my Contact" link to the email signature',
            }),
            option2: intl.formatMessage({
              defaultMessage: 'Option 2: Add a complete signature',
              id: '6zeH8H',
              description:
                'Option 2: Generate a complete email signature for the email signature',
            }),
            option2Step1: intl.formatMessage({
              defaultMessage:
                'For those looking for a complete signature overhaul, we have a stunning signature design for you to consider.',
              id: 'SzWasb',
              description:
                'Content of the option 2: If you want a complete email signature',
            }),
            option2Step2: intl.formatMessage({
              defaultMessage:
                'Tap on the button below to open detailed instructions on how to set up your new signature.',
              id: 'aw4Fqu',
              description: 'Content of the option 2: Tap on the button below',
            }),
            option2Action: intl.formatMessage({
              defaultMessage: 'Add a new signature',
              id: '/Je10K',
              description: 'Action button to add a new signature to the email',
            }),
            believe: intl.formatMessage({
              defaultMessage: `We believe these enhancements will not only add a personal touch to your emails but also make it easier for your contacts to connect with you.<br/>
<br/>
Thank you for choosing azzapp to elevate your email experience.<br/>
<br/>
Best regards<br/>
<br/>
The azzapp Team`,
              id: 'N7b2lI',
              description:
                'End of the email sent to the user when generating an email signature',
            }),
            question: intl.formatMessage({
              defaultMessage: `If you have any questions or need assistance, feel free to reach out.<br/> Enjoy using azzapp!`,
              id: 'ARm/k4',
              description:
                'Question at the end of the email sent to the user when generating an email signature',
            }),
            copyright: intl.formatMessage(
              {
                defaultMessage: '©{year} ©azzapp All rights reserved.',
                id: 'AoZZwc',
                description: 'Copyright',
              },
              {
                year: new Date().getFullYear(),
              },
            ),
          },
        },
      ],
    });
  }

  return linkUrl;
};
