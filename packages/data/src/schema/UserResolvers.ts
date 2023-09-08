import { getUserProfiles } from '#domains';
import type { UserResolvers } from './__generated__/types';

export const User: UserResolvers = {
  email: async (_root, _args, { auth, loaders }) => {
    if (!auth.userId) {
      return null;
    }

    const user = await loaders.User.load(auth.userId);

    return user?.email ?? null;
  },
  phoneNumber: async (_root, _args, { auth, loaders }) => {
    if (!auth.userId) {
      return null;
    }

    const user = await loaders.User.load(auth.userId);

    return user?.phoneNumber ?? null;
  },
  profiles: async (_root, _args, { auth }) => {
    if (!auth.userId) {
      return null;
    }

    return getUserProfiles(auth.userId);
  },
};
