import { GraphQLError } from 'graphql';
import { getLastTermsOfUse, updateUser } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#/__generated__/types';

const acceptTermsOfUseMutation: MutationResolvers['acceptTermsOfUse'] =
  async _ => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    const termsOfUse = await getLastTermsOfUse();

    if (!termsOfUse) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    const updates = {
      termsOfUseAcceptedVersion: termsOfUse.version,
      termsOfUseAcceptedAt: new Date(),
    };

    await updateUser(user.id, {
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
