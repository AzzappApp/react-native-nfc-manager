import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import { getProfilesFromWebCard, getWebCardById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { sendEmailSignatures } from '#externals';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

export const sendEmailSignaturesMutation: MutationResolvers['sendEmailSignatures'] =
  async (_, { webCardId: gqlWebCardId, profileIds, allProfiles }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    await checkWebCardProfileAdminRight(webCardId);

    if (!profileIds?.length && !allProfiles) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCard = await getWebCardById(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const foundProfileIds = (
      await getProfilesFromWebCard(
        webCard.id,
        allProfiles
          ? undefined
          : profileIds?.map(id => fromGlobalIdWithType(id, 'Profile')),
      )
    ).map(profile => profile.id);

    await sendEmailSignatures(foundProfileIds, webCard);

    return {
      profileIds: foundProfileIds.map(id => toGlobalId('Profile', id)),
      sentCount: foundProfileIds.length,
    };
  };

export default sendEmailSignaturesMutation;
