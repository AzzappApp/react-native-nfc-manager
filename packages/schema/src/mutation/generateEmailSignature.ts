import { GraphQLError } from 'graphql';
import { getProfileWithWebCardById } from '@azzapp/data';
import { generateEmailSignature } from '@azzapp/service/emailSignatureServices';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const generateEmailSignatureMutation: MutationResolvers['generateEmailSignature'] =
  async (
    _parent,
    { profileId: gqlProfileId, config: { preview } },
    { intl },
  ) => {
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

    if (profile.userId !== userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    await validateCurrentSubscription(userId, {
      action: 'GENERATE_EMAIL_SIGNATURE',
      webCardIsMultiUser: webCard.isMultiUser,
    });

    const linkUrl = await generateEmailSignature({
      profile,
      webCard,
      preview,
      intl,
    });

    return {
      url: linkUrl,
    };
  };

export default generateEmailSignatureMutation;
