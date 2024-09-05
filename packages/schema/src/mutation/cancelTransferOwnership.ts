import { GraphQLError } from 'graphql';
import { getWebCardPendingOwnerProfile, updateProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileLoader } from '#loaders';
import { hasWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const cancelTransferOwnership: MutationResolvers['cancelTransferOwnership'] =
  async (_, { webCardId: gqlWebCardId }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    if (!(await hasWebCardOwnerProfile(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const targetProfile = await getWebCardPendingOwnerProfile(webCardId);

    if (!targetProfile) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    await updateProfile(targetProfile.id, { promotedAsOwner: false });
    const updatedProfile = { ...targetProfile, promotedAsOwner: false };
    profileLoader.prime(targetProfile.id, updatedProfile);

    return {
      profile: updatedProfile,
    };
  };

export default cancelTransferOwnership;
