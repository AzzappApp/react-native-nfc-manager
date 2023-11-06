import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { unfollows } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeFollowerMutation: MutationResolvers['removeFollower'] = async (
  _,
  { input: { webCardId: removedFollowerId } },
  { auth, loaders },
) => {
  const { profileId, userId } = auth;
  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { id: targetId, type } = fromGlobalId(removedFollowerId);
  const webCard = await loaders.WebCard.load(targetId);
  if (type !== 'WebCard' || !webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!webCard.cardIsPrivate) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  try {
    await unfollows(targetId, profile.webCardId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
