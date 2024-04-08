import { removeProfileById } from '@azzapp/data';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

type Mutation = MutationResolvers['quitWebCard'];

const quitWebCard: Mutation = async (_, params) => {
  const profileId = fromGlobalIdWithType(params.profileId, 'Profile');

  await removeProfileById(profileId);

  return {
    profileId: params.profileId,
  };
};

export default quitWebCard;
