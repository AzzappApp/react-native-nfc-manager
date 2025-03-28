import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import {
  getActivePaymentMeans,
  getCommonWebCardProfiles,
  getUserProfilesWithWebCard,
  getUserPayments,
  countUserPayments,
  getTotalMultiUser,
  getLastTermsOfUse,
} from '@azzapp/data';
import { getSessionInfos } from '#GraphQLContext';
import {
  subscriptionsForUserLoader,
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
    const subscriptions = await subscriptionsForUserLoader.load(user.id);

    return subscriptions[0] ?? null;
  },
  isPremium: async user => {
    if (!isSameUser(user)) {
      return null;
    }
    const subscription = await subscriptionsForUserLoader.load(user.id);
    const lastSubscription = subscription.length ? subscription[0] : null;
    return (
      lastSubscription &&
      (lastSubscription.status === 'active' ||
        lastSubscription.endAt < new Date())
    );
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
    if (!user.termsOfUseAcceptedVersion) {
      return false;
    }
    const termsOfUse = await getLastTermsOfUse();

    return !termsOfUse || termsOfUse.version === user.termsOfUseAcceptedVersion;
  },
  userContactData: async user => {
    return {
      ...user.userContactData,
      email: user.userContactData?.email
        ? user.userContactData.email
        : user.email,
      phoneNumber: user.userContactData?.phoneNumber
        ? user.userContactData.phoneNumber
        : user.phoneNumber,
    };
  },
  cookiePreferences: async user => {
    return user.cookiePreferences;
  },
};
