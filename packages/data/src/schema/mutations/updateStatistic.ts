import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import {
  incrementContactCardScans,
  updateStatistics,
  incrementWebCardViews,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateWebcardViews: MutationResolvers['updateWebcardViews'] = async (
  _,
  { input: { id } },
  { auth },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTORIZED);
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

const updateContactcardScans: MutationResolvers['updateContactcardScans'] =
  async (_, { input: { id } }, { auth }) => {
    const { profileId } = auth;

    if (!profileId) {
      throw new GraphQLError(ERRORS.UNAUTORIZED);
    }

    const { id: targetId, type } = fromGlobalId(id);

    if (type !== 'Profile') {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    try {
      if (targetId !== profileId) {
        await incrementContactCardScans(targetId);
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
    throw new GraphQLError(ERRORS.UNAUTORIZED);
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

export { updateWebcardViews, updateContactcardScans, updateLikes };
