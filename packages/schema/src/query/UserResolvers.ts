import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import {
  getActivePaymentMeans,
  getCommonWebCardProfiles,
  getUserProfilesWithWebCard,
  getUserPayments,
  countUserPayments,
  getActiveUserSubscriptions,
  getTotalMultiUser,
  getLastTermsOfUse,
} from '@azzapp/data';
import { getSessionInfos } from '#GraphQLContext';
import {
  activeSubscriptionsForUserLoader,
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
    const subscriptions = await activeSubscriptionsForUserLoader.load(user.id);

    return subscriptions[0] ?? null;
  },
  isPremium: async user => {
    if (!isSameUser(user)) {
      return null;
    }
    const subscription = await getActiveUserSubscriptions([user.id]);
    return !!subscription.filter(sub => !!sub).length;
  },
  paymentMeans: async user => {
    return getActivePaymentMeans(user.id);
  },
  payments: async (user, args) => {
    let { after, first } = args;
    after = after ?? null;
    first = first ?? 100;

    const offset = after ? cursorToOffset(after) : 0;

    return connectionFromArraySlice(
      await getUserPayments(user.id, first, offset),
      { after, first },
      {
        sliceStart: offset,
        arrayLength: await countUserPayments(user.id),
      },
    );
  },
  usedMultiUserSeats: async user => {
    if (!isSameUser(user)) {
      return 0;
    }
    const totalSeats = await getTotalMultiUser(user.id);
    return totalSeats;
  },
  hasAcceptedLastTermsOfUse: async user => {
    const termsOfUse = await getLastTermsOfUse();

    return !termsOfUse || termsOfUse.version === user.termsOfUseAcceptedVersion;
  },
};
