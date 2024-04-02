import { activeUserSubscription, getProfilesOfUser } from '#domains';
import type { UserResolvers } from './__generated__/types';
export const User: UserResolvers = {
  profiles: async (user, _args, { auth, loaders }) => {
    if (!auth.userId) {
      return null;
    }

    const result = await getProfilesOfUser(auth.userId);

    result.forEach(({ Profile, WebCard }) => {
      loaders.profileByWebCardIdAndUserId.prime(
        { userId: auth.userId!, webCardId: Profile.webCardId },
        Profile,
      );
      loaders.Profile.prime(Profile.id, Profile);

      if (Profile.profileRole === 'owner') {
        loaders.webCardOwners.prime(Profile.webCardId, user);
      }

      loaders.WebCard.prime(WebCard.id, WebCard);
    });

    return result.map(({ Profile }) => Profile);
  },
  userSubscription: async (user, _args, { auth }) => {
    if (!auth.userId || auth.userId !== user.id) {
      return null;
    }
    const subscription = await activeUserSubscription(auth.userId);
    if (!subscription || activeUserSubscription.length === 0) {
      return null;
    }
    return subscription[0];
  },
};
