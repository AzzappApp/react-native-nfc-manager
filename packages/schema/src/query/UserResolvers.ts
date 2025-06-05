import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import {
  getActivePaymentMeans,
  getUserProfilesWithWebCard,
  getUserPayments,
  countUserPayments,
  getTotalMultiUser,
  getLastTermsOfUse,
  getSharedWebCardRelation,
  getUserContacts,
  getUserContactsGroupedByDate,
  getUserContactsCount,
  getUserContactsGroupedByLocation,
  getNbNewContactsForUser,
  hasProfiles,
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
import {
  cursorToDate,
  dateToCursor,
  emptyConnection,
} from '#helpers/connectionsHelpers';
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
  hasProfiles: async user => {
    return hasProfiles(user.id);
  },
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
  nbNewContacts: async user => {
    return getNbNewContactsForUser(user.id);
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
  nbContacts: async user => {
    if (!isSameUser(user)) {
      return 0;
    }
    return getUserContactsCount(user.id);
  },
  contacts: async (user, { after, first, search, orderBy, date, location }) => {
    if (!isSameUser(user)) {
      return emptyConnection;
    }
    const { hasMore, contactsWithCursor } = await getUserContacts(
      user.id,
      orderBy ?? 'name',
      search,
      location,
      date,
      after,
      first ?? 50,
    );
    return {
      edges: contactsWithCursor.map(({ contact, cursor }) => ({
        node: contact,
        cursor,
      })),
      pageInfo: {
        hasNextPage: hasMore,
        hasPreviousPage: false,
        startCursor: contactsWithCursor[0]?.cursor,
        endCursor:
          contactsWithCursor[contactsWithCursor.length - 1]?.cursor ?? null,
      },
    };
  },
  contactsByDates: async (user, { after, first, nbContactsByDate, search }) => {
    if (!isSameUser(user)) {
      return emptyConnection;
    }
    const { hasMore, dates } = await getUserContactsGroupedByDate(
      user.id,
      search,
      nbContactsByDate ?? 5,
      after ? cursorToDate(after) : null,
      first ?? 50,
    );
    const firstDate = dates.at(0)?.date;
    const lastDate = dates.at(-1)?.date;
    return {
      edges: dates.map(({ date, nbContacts, contacts }) => ({
        node: {
          date,
          nbContacts,
          contacts,
        },
        cursor: dateToCursor(date),
      })),
      pageInfo: {
        hasNextPage: hasMore,
        hasPreviousPage: false,
        startCursor: firstDate ? dateToCursor(firstDate) : null,
        endCursor: lastDate ? dateToCursor(lastDate) : null,
      },
    };
  },
  contactsByLocation: async (
    user,
    { after, nbContactsByLocations, first, search },
  ) => {
    if (!isSameUser(user)) {
      return emptyConnection;
    }
    if (after === '\uFFFF') {
      // This should never happen null location are always at the end
      return emptyConnection;
    }
    const { hasMore, locations } = await getUserContactsGroupedByLocation(
      user.id,
      search,
      nbContactsByLocations ?? 5,
      after ?? null,
      first ?? 50,
    );
    return {
      edges: locations.map(({ location, nbContacts, contacts }) => ({
        node: {
          location,
          contacts,
          nbContacts,
        },
        cursor: location ?? `\uFFFF`,
      })),
      pageInfo: {
        hasNextPage: hasMore,
        hasPreviousPage: false,
        startCursor: locations.length
          ? (locations[0].location ?? `\uFFFF`)
          : null,
        endCursor: locations.length
          ? (locations[locations.length - 1].location ?? `\uFFFF`)
          : null,
      },
    };
  },
};
