import DataLoader from 'dataloader';
import { and, eq, inArray } from 'drizzle-orm';
import ExpiryMap from 'expiry-map';
import {
  CardModuleTable,
  CardStyleTable,
  CardTemplateTable,
  CardTemplateTypeTable,
  ColorPaletteTable,
  CompanyActivityTable,
  CoverTemplatePreviewTable,
  CoverTemplateTable,
  CoverTemplateTypeTable,
  CoverTemplateTagTable,
  MediaTable,
  PostCommentTable,
  PostTable,
  WebCardCategoryTable,
  ProfileTable,
  ModuleBackgroundTable,
  UserTable,
  getLastWebCardListStatisticsFor,
  getLastProfileListStatisticsFor,
  getOwners,
  db,
  sortEntitiesByIds,
  WebCardTable,
  PaymentTable,
  PaymentMeanTable,
  CompanyActivityTypeTable,
  getCardModulesForWebCards,
  activeUserSubscription,
  getLocalizationMessagesByKeys,
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
  WebCardCategory,
  Post,
  PostComment,
  Media,
  CoverTemplate,
  CoverTemplateType,
  CoverTemplateTag,
  CompanyActivity,
  ColorPalette,
  CardTemplateType,
  CardTemplate,
  CardStyle,
  PaymentMean,
  Payment,
  CompanyActivityType,
  UserSubscription,
  ModuleBackground,
} from '@azzapp/data';

import type { Locale } from '@azzapp/i18n';

/*
  WebCardTable,
  sortEntitiesByIds,
  getLabels,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
*/

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

const entities = [
  'CardModule',
  'CardStyle',
  'CardTemplate',
  'CardTemplateType',
  'ColorPalette',
  'CompanyActivity',
  'CompanyActivityType',
  'CoverTemplate',
  'CoverTemplateType',
  'CoverTemplateTag',
  'Media',
  'PostComment',
  'Post',
  'WebCardCategory',
  'Profile',
  'ModuleBackground',
  'User',
  'WebCard',
  'Payment',
  'PaymentMean',
] as const;

type Entity = (typeof entities)[number];

type EntityToType<T extends Entity> = {
  CardModule: CardModule;
  CardStyle: CardStyle;
  CardTemplate: CardTemplate;
  CardTemplateType: CardTemplateType;
  ColorPalette: ColorPalette;
  CompanyActivity: CompanyActivity;
  CompanyActivityType: CompanyActivityType;
  CoverTemplate: CoverTemplate;
  CoverTemplateType: CoverTemplateType;
  CoverTemplateTag: CoverTemplateTag;
  Media: Media;
  PostComment: PostComment;
  Post: Post;
  WebCardCategory: WebCardCategory;
  Profile: Profile;
  WebCard: WebCard;
  ModuleBackground: ModuleBackground;
  User: User;
  Payment: Payment;
  PaymentMean: PaymentMean;
}[T];

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
};

const entitiesTable = {
  CardModule: CardModuleTable,
  CardStyle: CardStyleTable,
  CardTemplate: CardTemplateTable,
  CardTemplateType: CardTemplateTypeTable,
  ColorPalette: ColorPaletteTable,
  CompanyActivity: CompanyActivityTable,
  CompanyActivityType: CompanyActivityTypeTable,
  CoverTemplate: CoverTemplateTable,
  CoverTemplateType: CoverTemplateTypeTable,
  CoverTemplatePreview: CoverTemplatePreviewTable,
  CoverTemplateTag: CoverTemplateTagTable,
  Media: MediaTable,
  PostComment: PostCommentTable,
  Post: PostTable,
  WebCardCategory: WebCardCategoryTable,
  Profile: ProfileTable,
  WebCard: WebCardTable,
  ModuleBackground: ModuleBackgroundTable,
  User: UserTable,
  Payment: PaymentTable,
  PaymentMean: PaymentMeanTable,
} as const;

const getEntitiesByIds = async (
  entity: Entity,
  ids: readonly string[],
): Promise<Array<EntityToType<Entity> | null>> => {
  if (ids.length === 0) {
    return [];
  }
  if (ids.length === 1) {
    const entityById = await db
      .client()
      .select()
      .from(entitiesTable[entity])
      .where(eq(entitiesTable[entity].id, ids[0]));
    return [(entityById[0] as any) ?? null];
  }
  return sortEntitiesByIds(
    ids,
    (await db
      .client()
      .select()
      .from(entitiesTable[entity])
      .where(inArray(entitiesTable[entity].id, ids as string[]))) as Array<
      EntityToType<Entity>
    >,
  );
};

const dataLoadersOptions = {
  batchScheduleFn: setTimeout,
};

const createProfileByWebCardIdAndUserIdLoader = () =>
  new DataLoader<{ userId: string; webCardId: string }, Profile | null, string>(
    async keys => {
      return Promise.all(
        keys.map(key => {
          return db
            .client()
            .select()
            .from(ProfileTable)
            .where(
              and(
                eq(ProfileTable.userId, key.userId),
                eq(ProfileTable.webCardId, key.webCardId),
              ),
            )
            .then(res => res.pop() || null);
        }),
      );
    },
    {
      ...dataLoadersOptions,
      cacheKeyFn: key => `${key.userId}-${key.webCardId}`,
    },
  );

const webCardStatisticsLoader = () =>
  new DataLoader<string, WebCardStatistic[]>(
    async keys => {
      const stats = await getLastWebCardListStatisticsFor(keys as string[], 30);

      return keys.map(key => stats.filter(stat => stat.webCardId === key));
    },
    {
      ...dataLoadersOptions,
      cacheKeyFn: key => `${key}`,
    },
  );

const profileStatisticsLoader = () =>
  new DataLoader<string, ProfileStatistic[]>(
    async keys => {
      console.log('profileStatisticsLoader', keys);
      const stats = await getLastProfileListStatisticsFor(keys as string[], 30);

      return keys.map(key => stats.filter(stat => stat.profileId === key));
    },
    {
      ...dataLoadersOptions,
      cacheKeyFn: key => `${key}`,
    },
  );

const webCardOwnerLoader = () =>
  new DataLoader<string, User | null>(async keys => {
    const profiles = await getOwners(keys as string[]);

    return keys.map(k => profiles.find(p => p.webCardId === k)?.user ?? null);
  }, dataLoadersOptions);

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
    const modules = await getCardModulesForWebCards(keys as string[]);

    return keys.map(k => modules.filter(m => m.webCardId === k));
  }, dataLoadersOptions);

const activeSubscriptionsLoader = () =>
  new DataLoader<string, UserSubscription[]>(async keys => {
    if (keys.length === 0) {
      return [];
    }
    const modules = await activeUserSubscription(keys as string[]);

    return keys.map(k => modules.filter(m => m.userId === k));
  }, dataLoadersOptions);

export const createLoaders = (): Loaders =>
  new Proxy({} as Loaders, {
    get: (
      loaders: Loaders,
      entity:
        | Entity
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
        } else if (entity === 'profileByWebCardIdAndUserId') {
          loaders.profileByWebCardIdAndUserId =
            createProfileByWebCardIdAndUserIdLoader();
        } else if (entities.includes(entity)) {
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
