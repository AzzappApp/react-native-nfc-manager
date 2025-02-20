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

    await updateUser(userId, {
      termsOfUseAcceptedVersion: termsOfUse.version,
      termsOfUseAcceptedAt: new Date(),
    });

    const user = await userLoader.load(userId);

    return {
      user,
    };
  };

export default acceptTermsOfUseMutation;
