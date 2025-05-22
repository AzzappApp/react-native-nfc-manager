import { GraphQLError } from 'graphql';
import { getProfileWithWebCardById } from '@azzapp/data';

import ERRORS from '@azzapp/shared/errors';

import { sendEmailSignature } from '#externals';
import { getSessionUser } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const generateEmailSignatureWithKey: MutationResolvers['generateEmailSignatureWithKey'] =
  async (
    _parent,
    { input: { profileId: gqlProfileId, deviceId, key } },
    { apiEndpoint },
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

    await validateCurrentSubscription(
      user.id,
      {
        action: 'GENERATE_EMAIL_SIGNATURE',
        webCardIsMultiUser: webCard.isMultiUser,
      },
      apiEndpoint,
    );

    sendEmailSignature(profile.id, deviceId, key);

    return { done: true };
  };

export { generateEmailSignatureWithKey };
