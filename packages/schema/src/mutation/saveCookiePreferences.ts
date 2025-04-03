import { GraphQLError } from 'graphql';
import { getUserById, updateUser } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import type { MutationResolvers } from '#__generated__/types';

const saveCookiePreferences: MutationResolvers['saveCookiePreferences'] =
  async (_, { input: cookiePreferences }) => {
    const { userId } = getSessionInfos();
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const user = await getUserById(userId);
    if (!user) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    try {
      await updateUser(userId, {
        cookiePreferences,
      });
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return {
      user: {
        ...user,
        cookiePreferences,
      },
    };
  };

export default saveCookiePreferences;
