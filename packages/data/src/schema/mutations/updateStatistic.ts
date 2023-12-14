import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import {
  updateStatistics,
  incrementWebCardViews,
  incrementContactCardScans,
  db,
  updateContactCardTotalScans,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateWebCardViews: MutationResolvers['updateWebCardViews'] = async (
  _,
  { input: { id } },
  { auth },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const { id: targetId, type } = fromGlobalId(id);
  if (type !== 'Profile') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  try {
    if (targetId !== profileId) {
      await incrementWebCardViews(profileId);
    }

    return true;
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

const updateContactCardScans: MutationResolvers['updateContactCardScans'] =
  async (_, { input: { profileId } }, { auth }) => {
    if (!profileId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    try {
      if (profileId !== auth.profileId) {
        await db.transaction(async tx => {
          await updateContactCardTotalScans(profileId, tx);
          await incrementContactCardScans(profileId, true, tx);
        });
      }

      return true;
    } catch (error) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

const updateLikes: MutationResolvers['updateLikes'] = async (
  _,
  { input: { id } },
  { auth },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const { id: targetId, type } = fromGlobalId(id);

  if (type !== 'Profile') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  try {
    if (targetId !== profileId) {
      await updateStatistics(targetId, 'likes', true);
    }

    return true;
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export { updateWebCardViews, updateContactCardScans, updateLikes };
