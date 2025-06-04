import { GraphQLError } from 'graphql';
import { updateUser } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#__generated__/types';

const saveCookiePreferences: MutationResolvers['saveCookiePreferences'] =
  async (_, { input: cookiePreferences }) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    try {
      await updateUser(user.id, {
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
