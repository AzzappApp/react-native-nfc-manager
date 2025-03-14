import { GraphQLError } from 'graphql';
import { getUserById, getProfileWithWebCardById } from '@azzapp/data';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import { sendTemplateEmail } from '@azzapp/shared/emailHelpers';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { buildEmailSignatureGenerationUrl } from '@azzapp/shared/urlHelpers';
import { getSessionInfos } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const generateEmailSignature: MutationResolvers['generateEmailSignature'] =
  async (_parent, { profileId: gqlProfileId, config: { preview } }) => {
    const { userId } = getSessionInfos();

    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

    const res = await getProfileWithWebCardById(profileId);
    if (!res) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    const { profile, webCard } = res;
    if (!profile?.contactCard || !webCard.userName) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await validateCurrentSubscription(userId, {
      action: 'GENERATE_EMAIL_SIGNATURE',
      webCardIsMultiUser: webCard.isMultiUser,
    });

    const avatarUrl = await buildAvatarUrl(profile, null);
    const { data, signature } = await serializeAndSignEmailSignature(
      webCard.userName,
      profileId,
      webCard.id,
      profile.contactCard,
      webCard.commonInformation,
      avatarUrl,
    );

    const { data: contactCardData, signature: contactCardSignature } =
      await serializeAndSignContactCard(
        webCard.userName,
        profileId,
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

    const mailParam = {
      linkUrl,
    } as const;

    const userEmail = await getUserById(userId);

    if (userEmail?.email) {
      await sendTemplateEmail({
        templateId: 'd-87dd47b327fa44b38f7bdbea5cb6daaf',
        recipients: [
          {
            to: userEmail.email,
            dynamicTemplateData: mailParam,
          },
        ],
        attachments: [
          {
            filename: 'azzapp_contact.jpg',
            content: preview,
            type: 'image/jpeg',
            contentId: 'contact',
            disposition: 'inline',
          },
        ],
      });
    }

    return {
      url: linkUrl,
    };
  };

export default generateEmailSignature;
