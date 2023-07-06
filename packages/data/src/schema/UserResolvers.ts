import { getUserProfiles } from '#domains';
import type { UserResolvers } from './__generated__/types';

export const User: UserResolvers = {
  email: async (_root, _args, { auth, userLoader }) => {
    if (auth.isAnonymous) {
      return null;
    }

    const user = await userLoader.load(auth.userId);

    return user?.email ?? null;
  },
  phoneNumber: async (_root, _args, { auth, userLoader }) => {
    if (auth.isAnonymous) {
      return null;
    }

    const user = await userLoader.load(auth.userId);

    return user?.phoneNumber ?? null;
  },
  profiles: async (_root, _args, { auth }) => {
    if (auth.isAnonymous) {
      return null;
    }

    return getUserProfiles(auth.userId);
  },
};
