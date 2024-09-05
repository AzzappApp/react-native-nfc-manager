import { GraphQLError } from 'graphql';
import { getWebCardById, unfollows } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

type Mutation = MutationResolvers['removeFollower'];

const removeFollowerMutation: Mutation = async (_, params) => {
  const webCardId = fromGlobalIdWithType(params.webCardId, 'WebCard');
  if (!(await hasWebCardProfileEditorRight(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
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
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
