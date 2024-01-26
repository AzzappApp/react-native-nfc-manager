import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { getUserProfileWithWebCardId, unfollows } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeFollowerMutation: MutationResolvers['removeFollower'] = async (
  _,
  {
    input: { removedFollowerId: gqlRemovedFollowerId, webCardId: gqlWebCardId },
  },
  { auth, loaders },
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isEditor(profile.profileRole) || profile.invited) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard?.cardIsPrivate) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const removedFollowerId = fromGlobalIdWithType(
    gqlRemovedFollowerId,
    'WebCard',
  );
  try {
    await unfollows(removedFollowerId, profile.webCardId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
