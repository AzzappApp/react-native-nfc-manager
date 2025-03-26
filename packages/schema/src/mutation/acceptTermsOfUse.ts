import { GraphQLError } from 'graphql';
import { getLastTermsOfUse, updateUser } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { userLoader } from '#loaders';
import type { MutationResolvers } from '#/__generated__/types';

const acceptTermsOfUseMutation: MutationResolvers['acceptTermsOfUse'] =
  async _ => {
    const { userId } = getSessionInfos();

    if (!userId) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const termsOfUse = await getLastTermsOfUse();

    if (!termsOfUse) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const user = await userLoader.load(userId);

    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const updates = {
      termsOfUseAcceptedVersion: termsOfUse.version,
      termsOfUseAcceptedAt: new Date(),
    };

    await updateUser(userId, {
      termsOfUseAcceptedVersion: termsOfUse.version,
      termsOfUseAcceptedAt: new Date(),
    });

    return {
      user: {
        ...user,
        ...updates,
      },
    };
  };

export default acceptTermsOfUseMutation;
