import {
  activeUserSubscription,
  getUserProfilesWithWebCard,
} from '@azzapp/data';
import type { UserResolvers } from './__generated__/types';
export const User: UserResolvers = {
  profiles: async (user, _args, { auth, loaders }) => {
    if (!auth.userId) {
      return null;
    }

    const result = await getUserProfilesWithWebCard(auth.userId);

    result.forEach(({ profile, webCard }) => {
      loaders.profileByWebCardIdAndUserId.prime(
        { userId: auth.userId!, webCardId: profile.webCardId },
        profile,
      );
      loaders.Profile.prime(profile.id, profile);

      if (profile.profileRole === 'owner') {
        loaders.webCardOwners.prime(profile.webCardId, user);
      }
      loaders.WebCard.prime(webCard.id, webCard);
    });

    return result.map(({ profile }) => profile);
  },
  userSubscription: async (user, _args, { auth, loaders }) => {
    if (!auth.userId || auth.userId !== user.id) {
      return null;
    }
    const subscriptions = await loaders.activeSubscriptionsLoader.load(
      auth.userId,
    );

    return subscriptions.find(sub => sub.webCardId === null) ?? null;
  },
  isPremium: async user => {
    const subscription = await activeUserSubscription([user.id]);

    return !!subscription?.length;
  },
};
