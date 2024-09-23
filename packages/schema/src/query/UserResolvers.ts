import {
  activeUserSubscription,
  getCommonWebCardProfiles,
  getUserProfilesWithWebCard,
} from '@azzapp/data';
import { getSessionInfos } from '#GraphQLContext';
import {
  activeSubscriptionsLoader,
  profileByWebCardIdAndUserIdLoader,
  profileLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import { createSessionDataLoader } from '#helpers/dataLoadersHelpers';
import { type ProtectedResolver } from '#helpers/permissionsHelpers';
import type { UserResolvers } from '#/__generated__/types';
import type { User as UserModel } from '@azzapp/data';

const isSameUser = async (user: UserModel) => {
  const { userId } = getSessionInfos();
  return userId === user.id;
};

const commonProfilesDataLoader = createSessionDataLoader(
  'CommonProfilesDataLoader',
  async (keys: readonly string[]) => {
    const { userId } = getSessionInfos();
    if (!userId) {
      return keys.map(() => null);
    }
    const profiles = await getCommonWebCardProfiles(userId, keys);

    return keys.map(key => profiles[key] ?? null);
  },
);

const hasAdminRightOnSharedWebCard = async (user: UserModel) => {
  const profiles = (await commonProfilesDataLoader.load(user.id)) ?? [];
  return profiles.some(
    profileRole => profileRole === 'owner' || profileRole === 'admin',
  );
};

export const User: ProtectedResolver<UserResolvers> = {
  id: user => user.id,
  email(user) {
    if (!isSameUser(user) || !hasAdminRightOnSharedWebCard(user)) {
      return null;
    }
    return user.email;
  },
  phoneNumber(user) {
    if (!isSameUser(user) || !hasAdminRightOnSharedWebCard(user)) {
      return null;
    }
    return user.phoneNumber;
  },
  publishedWebCards: () => [],
  profiles: async user => {
    if (!isSameUser(user)) {
      return [];
    }
    const result = await getUserProfilesWithWebCard(user.id);
    result.forEach(({ profile, webCard }) => {
      profileByWebCardIdAndUserIdLoader.prime(
        { userId: user.id, webCardId: profile.webCardId },
        profile,
      );
      profileLoader.prime(profile.id, profile);

      if (profile.profileRole === 'owner') {
        webCardOwnerLoader.prime(profile.webCardId, user);
      }
      webCardLoader.prime(webCard.id, webCard);
    });
    return result.map(({ profile }) => profile);
  },
  userSubscription: async user => {
    if (!isSameUser(user)) {
      return null;
    }
    const subscriptions = await activeSubscriptionsLoader.load(user.id);

    return subscriptions.find(sub => sub.webCardId === null) ?? null;
  },
  isPremium: async user => {
    if (!isSameUser(user)) {
      return null;
    }
    const subscription = await activeUserSubscription([user.id]);
    return !!subscription.filter(sub => !!sub).length;
  },
};
