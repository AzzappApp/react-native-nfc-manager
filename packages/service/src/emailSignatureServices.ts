import { getActiveContactCardAccess, getUserById } from '@azzapp/data';
import { getEmailSignatureTitleColor } from '@azzapp/shared/colorsHelpers';
import { hmacWithPassword } from '@azzapp/shared/crypto';
import { serializeEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import {
  buildEmailSignatureGenerationUrl,
  buildEmailSignatureGenerationUrlWithKey,
} from '@azzapp/shared/urlHelpers';
import { sendTemplateEmail } from './emailServices';
import env from './env';
import { buildAvatarUrl, buildBannerUrl, buildLogoUrl } from './mediaServices';
import type { Profile, WebCard } from '@azzapp/data';
import type {
  CommonInformation,
  ContactCard,
} from '@azzapp/shared/contactCardHelpers';
import type { IntlShape } from '@formatjs/intl';
const IMAGE_AVATAR_LOGO_WIDTH = 180;

export const generateEmailSignature = async ({
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
      const serialized = JSON.stringify([contactCardAccess.id, key]);
      const signature = await hmacWithPassword(
        env.CONTACT_CARD_SIGNATURE_SECRET,
        serialized,
        {
          salt: `${webCard.userName}`,
        },
      );

      linkUrl = buildEmailSignatureGenerationUrlWithKey(
        webCard.userName,
        serialized,
        signature.digest,
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
              id: 'QpZ1Iw',
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
              id: 'BYBLJq',
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
              id: 'Ac75RT',
              description: 'Introduction of email signature',
            }),
            option1: intl.formatMessage({
              defaultMessage: 'Option 1: Add a "Save my Contact" link',
              id: '5e+Gsa',
              description:
                'Option 1: Add a "Save my Contact" link to your email signature',
            }),
            option1Step1: intl.formatMessage({
              defaultMessage:
                'If you already have a signature and wish to give it a modern twist, you can easily add a "Save my Contact" link. This feature allows your recipients to save your contact information with a single click.',
              id: 'kMupCi',
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
              id: 'W4euwn',
              description:
                'Action button to add "Save my Contact" link to the email signature',
            }),
            option2: intl.formatMessage({
              defaultMessage: 'Option 2: Add a complete signature',
              id: 'NA71Zb',
              description:
                'Option 2: Generate a complete email signature for the email signature',
            }),
            option2Step1: intl.formatMessage({
              defaultMessage:
                'For those looking for a complete signature overhaul, we have a stunning signature design for you to consider.',
              id: 'sQMAEW',
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
              id: 'EDZb54',
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

const serializeAndSignEmailSignature = async (
  userName: string,
  profileId: string,
  webCardId: string,
  card: ContactCard,
  commonInformation: CommonInformation | null | undefined,
  avatarUrl: string | null,
) => {
  const serialized = serializeEmailSignature(
    profileId,
    webCardId,
    card,
    commonInformation,
    avatarUrl,
  );

  const signature = await hmacWithPassword(
    env.CONTACT_CARD_SIGNATURE_SECRET,
    serialized,
    {
      salt: `${userName}`,
    },
  );

  return {
    signature: signature.digest,
    data: serialized,
  };
};
