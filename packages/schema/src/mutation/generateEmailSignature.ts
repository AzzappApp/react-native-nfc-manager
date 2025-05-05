import { GraphQLError } from 'graphql';
import { getProfileWithWebCardById } from '@azzapp/data';
import { generateEmailSignature } from '@azzapp/service/emailSignatureServices';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const generateEmailSignatureMutation: MutationResolvers['generateEmailSignature'] =
  async (_parent, { profileId: gqlProfileId }, { intl }) => {
    const user = await getSessionUser();
    if (!user) {
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

    if (profile.userId !== user.id) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    await validateCurrentSubscription(user.id, {
      action: 'GENERATE_EMAIL_SIGNATURE',
      webCardIsMultiUser: webCard.isMultiUser,
    });

    const linkUrl = await generateEmailSignature({
      profile,
      webCard,
      intl,
    });

    return {
      url: linkUrl,
    };
  };

const generateEmailSignatureWithKey: MutationResolvers['generateEmailSignatureWithKey'] =
  async (
    _parent,
    { input: { profileId: gqlProfileId, deviceId, key } },
    { intl },
  ) => {
    const user = await getSessionUser();
    if (!user) {
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

    if (profile.userId !== user.id) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    await validateCurrentSubscription(user.id, {
      action: 'GENERATE_EMAIL_SIGNATURE',
      webCardIsMultiUser: webCard.isMultiUser,
    });

    const linkUrl = await generateEmailSignature({
      profile,
      webCard,
      intl,
      deviceId,
      key,
    });

    return {
      url: linkUrl,
    };
  };

export {
  generateEmailSignatureMutation as generateEmailSignature,
  generateEmailSignatureWithKey,
};
