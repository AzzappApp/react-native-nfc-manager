import { getProfilesOfUser } from '#domains';
import type { UserResolvers } from './__generated__/types';

export const User: UserResolvers = {
  profiles: async (user, _args, { auth, loaders }) => {
    if (!auth.userId) {
      return null;
    }

    const result = await getProfilesOfUser(auth.userId);

    result.forEach(({ Profile }) => {
      loaders.profileByWebCardIdAndUserId.prime(
        { userId: auth.userId!, webCardId: Profile.webCardId },
        Profile,
      );
    });

    result.forEach(({ WebCard }) => {
      loaders.WebCard.prime(WebCard.id, WebCard);
    });

    return result.map(({ Profile }) => Profile);
  },
};
