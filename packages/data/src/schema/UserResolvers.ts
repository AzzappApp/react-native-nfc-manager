import { getUserProfiles, getUsersByIds } from '#domains';
import type { UserResolvers } from './__generated__/types';

export const User: UserResolvers = {
  email: async (_root, _args, context) => {
    const user = context.auth;
    if (user.isAnonymous) {
      return null;
    }

    const userId = user.userId;
    const [dbUser] = await getUsersByIds([userId]);

    return dbUser?.email ?? null;
  },
  phoneNumber: async (_root, _args, context) => {
    const user = context.auth;
    if (user.isAnonymous) {
      return null;
    }

    const userId = user.userId;
    const [dbUser] = await getUsersByIds([userId]);

    return dbUser?.phoneNumber ?? null;
  },
  profiles: async (_root, _args, context) => {
    const user = context.auth;
    if (user.isAnonymous) {
      return null;
    }

    return getUserProfiles(user.userId);
  },
};
