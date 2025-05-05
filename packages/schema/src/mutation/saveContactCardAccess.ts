import { GraphQLError } from 'graphql';
import { getProfileById, saveOrUpdateContactCardAccess } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

const saveContactCardAccess: MutationResolvers['saveContactCardAccess'] =
  async (_, { input: { deviceId, profileId: gqlProfileId, signature } }) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
    const profile = await getProfileById(profileId);
    if (!profile) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    if (profile.userId !== user.id) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    await saveOrUpdateContactCardAccess(deviceId, profileId, signature);

    return { profile };
  };

export default saveContactCardAccess;
