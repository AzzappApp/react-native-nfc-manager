import DataLoader from 'dataloader';
import ExpiryMap from 'expiry-map';
import {
  getProfileByUserAndWebCard,
  getLastWebCardListStatisticsFor,
  getLastProfileListStatisticsFor,
  getWebCardsOwnerUsers,
  getLocalizationMessagesByKeys,
  getCardModulesByWebCards,
  activeUserSubscription,
  getActiveUserSubscriptionForWebCard,
  getEntitiesByIds,
  ENTITIES,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import type {
  WebCard,
  CardModule,
  LocalizationMessage,
  User,
  ProfileStatistic,
  Profile,
  WebCardStatistic,
  UserSubscription,
  EntityToType,
  Entity,
} from '@azzapp/data';

import type { Locale } from '@azzapp/i18n';

export type GraphQLContext = {
  cardUsernamesToRevalidate: Set<string>;
  postsToRevalidate: Set<{ userName: string; id: string }>;
  auth: { userId?: string };
  locale: string;
  loaders: Loaders;
  sessionMemoized: <T>(t: () => T) => T;
  notifyUsers: (
    type: 'email' | 'phone',
    receivers: string[],
    webCard: WebCard,
    notificationType: 'invitation' | 'transferOwnership',
    locale: Locale,
  ) => Promise<void>;
  validateMailOrPhone: (
    type: 'email' | 'phone',
    issuer: string,
    token: string,
  ) => Promise<void>;
  buildCoverAvatarUrl: (webCard: WebCard | null) => Promise<string | null>;
};

export const createGraphQLContext = (
  notifyUsers: GraphQLContext['notifyUsers'],
  validateMailOrPhone: GraphQLContext['validateMailOrPhone'],
  buildCoverAvatarUrl: GraphQLContext['buildCoverAvatarUrl'],
  loaders: Loaders,
  locale: Locale = DEFAULT_LOCALE,
): Omit<GraphQLContext, 'auth'> => {
  const sessionMemoizedCache = new Map<any, any>();
  const sessionMemoized = <T>(fn: () => T): T => {
    if (sessionMemoizedCache.has(fn)) {
      return sessionMemoizedCache.get(fn);
    }
    const result = fn();
    sessionMemoizedCache.set(fn, result);
    return result;
  };

  return {
    locale,
    notifyUsers,
    validateMailOrPhone,
    cardUsernamesToRevalidate: new Set<string>(),
    postsToRevalidate: new Set<{ userName: string; id: string }>(),
    loaders,
    sessionMemoized,
    buildCoverAvatarUrl,
  };
};

export type Loaders = {
  [T in Entity]: DataLoader<string, EntityToType<T> | null>;
} & {
  profileByWebCardIdAndUserId: DataLoader<
    { userId: string; webCardId: string },
    Profile | null,
    string
  >;
  webCardStatistics: DataLoader<string, WebCardStatistic[]>;
  profileStatistics: DataLoader<string, ProfileStatistic[]>;
  webCardOwners: DataLoader<string, User | null>;
  labels: DataLoader<[string, string], LocalizationMessage | null>;
  cardModuleByWebCardLoader: DataLoader<string, CardModule[]>;
  activeSubscriptionsLoader: DataLoader<string, UserSubscription[]>;
  activeSubscriptionsForWebCardLoader: DataLoader<
    { userId: string; webCardId: string },
    UserSubscription | null
  >;
};

const dataLoadersOptions = {
  batchScheduleFn: setTimeout,
};

const createProfileByWebCardIdAndUserIdLoader = () =>
  new DataLoader<{ userId: string; webCardId: string }, Profile | null, string>(
    async keys =>
      Promise.all(
        keys.map(key => getProfileByUserAndWebCard(key.userId, key.webCardId)),
      ),
    {
      ...dataLoadersOptions,
      cacheKeyFn: key => `${key.userId}-${key.webCardId}`,
    },
  );

const webCardStatisticsLoader = () =>
  new DataLoader<string, WebCardStatistic[]>(
    async keys => {
      const stats = await getLastWebCardListStatisticsFor(keys as string[], 30);
      return keys.map(key => stats[key] ?? []);
    },
    { ...dataLoadersOptions },
  );

const profileStatisticsLoader = () =>
  new DataLoader<string, ProfileStatistic[]>(
    async keys => {
      const stats = await getLastProfileListStatisticsFor(keys as string[], 30);
      return keys.map(key => stats[key] ?? []);
    },
    { ...dataLoadersOptions },
  );

const webCardOwnerLoader = () =>
  new DataLoader<string, User | null>(
    getWebCardsOwnerUsers,
    dataLoadersOptions,
  );

const labelLoader = new DataLoader<
  [string, string],
  LocalizationMessage | null
>(
  async keys => {
    const labelsByLocale = keys.reduce(
      (acc, [id, locale]) => {
        if (!acc[locale]) {
          acc[locale] = [];
        }
        acc[locale].push(id);
        return acc;
      },
      {} as Record<string, string[]>,
    );
    const labelsWithLocale: Record<string, LocalizationMessage[]> =
      Object.fromEntries(
        await Promise.all(
          Object.entries(labelsByLocale).map(async ([locale, keys]) => [
            locale,
            await getLocalizationMessagesByKeys(keys, locale, ENTITY_TARGET),
          ]),
        ),
      );

    return keys.map(([key, locale]) => {
      return labelsWithLocale[locale].find(l => l.key === key) ?? null;
    });
  },
  {
    ...dataLoadersOptions,
    cacheMap: new ExpiryMap(1000 * 60 * 60), // 1 hour,
  },
);

const cardModuleByWebCardLoader = () =>
  new DataLoader<string, CardModule[]>(async keys => {
    if (keys.length === 0) {
      return [];
    }
    const modules = await getCardModulesByWebCards(keys as string[]);

    return keys.map(key => modules[key] ?? []);
  }, dataLoadersOptions);

const activeSubscriptionsLoader = () =>
  new DataLoader<string, UserSubscription[]>(async keys => {
    if (keys.length === 0) {
      return [];
    }
    const subscriptions = (
      await activeUserSubscription(keys as string[])
    ).filter(subscription => !!subscription);

    return keys.map(k =>
      subscriptions.filter(subscription => subscription.userId === k),
    );
  }, dataLoadersOptions);

const activeSubscriptionsForWebCardLoader = () =>
  new DataLoader<
    { userId: string; webCardId: string },
    UserSubscription | null
  >(async keys => {
    if (keys.length === 0) {
      return [];
    }
    const webCardIds = keys.map(k => k.webCardId);
    const userIds = keys.map(k => k.userId);

    const userSubscriptions = await getActiveUserSubscriptionForWebCard(
      userIds,
      webCardIds,
    );

    return keys.map(
      k =>
        userSubscriptions.find(
          u =>
            (k.webCardId && u.webCardId === k.webCardId) ||
            u.userId === k.userId,
        ) ?? null,
    );
  }, dataLoadersOptions);

export const createLoaders = (): Loaders =>
  new Proxy({} as Loaders, {
    get: (
      loaders: Loaders,
      entity:
        | Entity
        | 'activeSubscriptionsForWebCardLoader'
        | 'activeSubscriptionsLoader'
        | 'cardModuleByWebCardLoader'
        | 'labels'
        | 'profileByWebCardIdAndUserId'
        | 'profileStatistics'
        | 'webCardOwners'
        | 'webCardStatistics',
    ) => {
      if (!loaders[entity]) {
        if (entity === 'webCardStatistics') {
          loaders.webCardStatistics = webCardStatisticsLoader();
        } else if (entity === 'profileStatistics') {
          loaders.profileStatistics = profileStatisticsLoader();
        } else if (entity === 'webCardOwners') {
          loaders.webCardOwners = webCardOwnerLoader();
        } else if (entity === 'labels') {
          loaders.labels = labelLoader;
        } else if (entity === 'cardModuleByWebCardLoader') {
          loaders.cardModuleByWebCardLoader = cardModuleByWebCardLoader();
        } else if (entity === 'activeSubscriptionsLoader') {
          loaders.activeSubscriptionsLoader = activeSubscriptionsLoader();
        } else if (entity === 'activeSubscriptionsForWebCardLoader') {
          loaders.activeSubscriptionsForWebCardLoader =
            activeSubscriptionsForWebCardLoader();
        } else if (entity === 'profileByWebCardIdAndUserId') {
          loaders.profileByWebCardIdAndUserId =
            createProfileByWebCardIdAndUserIdLoader();
        } else if (ENTITIES.includes(entity)) {
          loaders[entity] = new DataLoader<string, EntityToType<Entity> | null>(
            ids => getEntitiesByIds(entity, ids),
            dataLoadersOptions,
          ) as any;
        } else {
          throw new Error(`Unknown entity: ${entity}`);
        }
      }
      return loaders[entity];
    },
  });
