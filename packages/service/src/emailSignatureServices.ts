import { getUserById } from '@azzapp/data';
import { sendTemplateEmail } from '@azzapp/shared/emailHelpers';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { buildEmailSignatureGenerationUrl } from '@azzapp/shared/urlHelpers';
import { buildAvatarUrl } from './mediaServices';
import type { Profile, WebCard } from '@azzapp/data';
import type { IntlShape } from '@formatjs/intl';

export const generateEmailSignature = async ({
  webCard,
  profile,
  intl,
  preview,
}: {
  webCard: WebCard;
  profile: Profile;
  intl: IntlShape;
  preview?: string;
}) => {
  if (!webCard.userName) {
    throw new Error('User name is required');
  }

  if (!profile.contactCard) {
    throw new Error('Contact card is required');
  }

  const avatarUrl = await buildAvatarUrl(profile, null);
  const { data, signature } = await serializeAndSignEmailSignature(
    webCard.userName,
    profile.id,
    webCard.id,
    profile.contactCard,
    webCard.isMultiUser ? webCard.commonInformation : undefined,
    avatarUrl,
  );

  const { data: contactCardData, signature: contactCardSignature } =
    await serializeAndSignContactCard(
      webCard.userName,
      profile.id,
      webCard.id,
      profile.contactCard,
      webCard.isMultiUser ? webCard.commonInformation : undefined,
    );

  const linkUrl = buildEmailSignatureGenerationUrl(
    webCard.userName,
    data,
    signature,
    contactCardData,
    contactCardSignature,
  );

  const user = await getUserById(profile.userId);

  if (user?.email) {
    await sendTemplateEmail({
      templateId: 'd-64a113c41c1d43068723b4aeefac3d97',
      recipients: [
        {
          to: user.email,
          dynamicTemplateData: {
            linkUrl,
            subject: intl.formatMessage({
              defaultMessage: 'Elevate your email signature',
              id: 'QtojF4',
              description:
                'Subject of the email sent to the user when generating an email signature',
            }),
            title: intl.formatMessage({
              defaultMessage: 'Your Dynamic Email Signature is Ready',
              id: 'BYBLJq',
              description:
                'Title of the email sent to the user when generating an email signature',
            }),
            embrace: intl.formatMessage({
              defaultMessage:
                'Embrace the benefits of a custom dynamic email signature',
              id: 'Ac75RT',
              description:
                'Embrace the benefits of a custom dynamic email signature',
            }),
            start: intl.formatMessage({
              defaultMessage: ` Start using now a dynamic email signature and allow email recipients to instantly save your details directly to their phone (and possibly share with others).<br/><br/> > Maximise networking<br/> > Enable two-way contact sharing to collect leads<br/> > Drive clicks to your social networks, website…<br/> > Make a lasting impression<br/> `,
              id: '2tKhB9',
              description:
                'Start of the email sent to the user when generating an email signature',
            }),
            option1: intl.formatMessage({
              defaultMessage: 'Option 1: Add a "Save my Contact" Button',
              id: '5e+Gsa',
              description:
                'Option 1: Add a "Save my Contact" button to your email signature',
            }),
            option1Step1: intl.formatMessage({
              defaultMessage:
                'If you are happy with your email signature and wish to enhance efficiency, you can easily add a "Save my Contact" button. This feature allows your recipients to save your contact information with a single click.',
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
              defaultMessage: 'Add “Save my Contact” button',
              id: 'W4euwn',
              description:
                'Action button to add "Save my Contact" button to the email signature',
            }),
            option2: intl.formatMessage({
              defaultMessage: 'Option 2: Generate a dynamic email signature',
              id: 'NA71Zb',
              description:
                'Option 2: Generate a dynamic email signature for the email signature',
            }),
            option2Step1: intl.formatMessage({
              defaultMessage:
                'If you want a complete email signature, we have a stunning signature design for you to consider.',
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
              defaultMessage: ` We believe these enhancements will not only add a modern touch to your emails but also make it easier for your contacts to connect with you.<br/> <br/> Thank you for choosing azzapp to elevate your email experience.<br/> `,
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
            hide_contact_image: !preview,
          },
        },
      ],
      attachments: preview
        ? [
            {
              filename: 'azzapp_contact.jpg',
              content: preview,
              type: 'image/jpeg',
              contentId: 'contact',
              disposition: 'inline',
            },
          ]
        : undefined,
    });
  }

  return linkUrl;
};
