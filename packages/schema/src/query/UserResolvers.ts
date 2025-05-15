import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import {
  getActivePaymentMeans,
  getUserProfilesWithWebCard,
  getUserPayments,
  countUserPayments,
  getTotalMultiUser,
  getLastTermsOfUse,
  getSharedWebCardRelation,
} from '@azzapp/data';
import env from '#env';
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

const isSameUser = (user: UserModel) => {
  const { userId } = getSessionInfos();
  return userId === user.id;
};

const canSeeEmailOrPhoneNumberLoader = createSessionDataLoader(
  'CanSeeEmailOrPhoneNumberLoader',
  async (keys: readonly string[]) => {
    const { userId } = getSessionInfos();
    if (!userId) {
      return keys.map(() => null);
    }

    const relations = await getSharedWebCardRelation(userId, keys);

    return keys.map(targetUserId => {
      const rel = relations[targetUserId];
      if (!rel) return false;

      return rel.isAdminOrOwner || rel.hasSharedWithOwner;
    });
  },
);

export const User: ProtectedResolver<UserResolvers> = {
  id: user => user.id,
  email: async user => {
    if (
      isSameUser(user) ||
      (await canSeeEmailOrPhoneNumberLoader.load(user.id))
    ) {
      return user.email;
    }
    return null;
  },
  phoneNumber: async user => {
    if (
      isSameUser(user) ||
      (await canSeeEmailOrPhoneNumberLoader.load(user.id))
    ) {
      return user.phoneNumber;
    }
    return null;
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
        lastSubscription.endAt > new Date())
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
  hasPassword: async user => {
    if (isSameUser(user)) {
      return user.password !== null;
    }

    return true; // we don't have a way to check if the user has a password
  },
  nbEnrichments: async user => {
    if (!isSameUser(user)) {
      return {
        total: 0,
        max: parseInt(env.MAX_ENRICHMENTS_PER_USER, 10),
      };
    }

    return {
      total: user.nbEnrichments,
      max: parseInt(env.MAX_ENRICHMENTS_PER_USER, 10),
    };
  },
};
