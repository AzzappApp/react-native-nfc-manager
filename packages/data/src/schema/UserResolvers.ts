import { getProfilesOfUser } from '#domains';
import type { UserResolvers } from './__generated__/types';

export const User: UserResolvers = {
  profiles: async (user, _args, { auth, loaders }) => {
    if (!auth.userId) {
      return null;
    }

    const result = await getProfilesOfUser(auth.userId);

    result.forEach(profile => {
      loaders.profileByWebCardIdAndUserId.prime(
        { userId: auth.userId!, webCardId: profile.webCardId },
        profile,
      );
    });

    return result;
  },
};
