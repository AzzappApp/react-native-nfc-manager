import { GraphQLError } from 'graphql';
import { unfollows } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const removeFollowerMutation: MutationResolvers['removeFollower'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: { removedFollowerId: gqlRemovedFollowerId },
  },
  { loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard?.cardIsPrivate) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const removedFollowerId = fromGlobalIdWithType(
    gqlRemovedFollowerId,
    'WebCard',
  );
  try {
    await unfollows(removedFollowerId, webCardId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
