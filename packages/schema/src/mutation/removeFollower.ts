import { GraphQLError } from 'graphql';
import { getWebCardById, unfollows } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const removeFollowerMutation: MutationResolvers['removeFollower'] = async (
  _,
  params,
) => {
  const webCardId = fromGlobalIdWithType(params.webCardId, 'WebCard');
  await checkWebCardProfileEditorRight(webCardId);

  const removedFollowerId = fromGlobalIdWithType(
    params.input.removedFollowerId,
    'WebCard',
  );

  const webCard = await getWebCardById(webCardId);
  if (!webCard?.cardIsPrivate) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  try {
    await unfollows(removedFollowerId, webCardId);
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
