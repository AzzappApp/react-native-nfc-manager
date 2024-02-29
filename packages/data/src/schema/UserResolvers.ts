import { getProfilesOfUser } from '#domains';
import type { UserResolvers } from './__generated__/types';

export const User: UserResolvers = {
  profiles: async (user, _args, { auth }) => {
    if (!auth.userId) {
      return null;
    }

    return getProfilesOfUser(auth.userId);
  },
};
