import DataLoader from 'dataloader';
import { eq, inArray } from 'drizzle-orm';
import {
  db,
  CardModuleTable,
  CardStyleTable,
  CardTemplateTable,
  CardTemplateTypeTable,
  ColorPaletteTable,
  CompanyActivityTable,
  CoverTemplateTable,
  MediaTable,
  MediaSuggestionTable,
  PostCommentTable,
  PostTable,
  WebCardCategoryTable,
  ProfileTable,
  StaticMediaTable,
  UserTable,
  getUserProfileWithWebCardId,
  getLastWebCardListStatisticsFor,
  getLastProfileListStatisticsFor,
  getOwners,
  WebCardTable,
  sortEntitiesByIds,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import type {
  Post,
  Media,
  Profile,
  CoverTemplate,
  StaticMedia,
  PostComment,
  User,
  CardStyle,
  CardTemplate,
  CardTemplateType,
  ColorPalette,
  CardModule,
  CompanyActivity,
  MediaSuggestion,
  WebCardCategory,
  WebCard,
  WebCardStatistic,
  ProfileStatistic,
} from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';

export type GraphQLContext = {
  cardUsernamesToRevalidate: Set<string>;
  postsToRevalidate: Set<{ userName: string; id: string }>;
  auth: { userId?: string };
  locale: string;
  loaders: Loaders;
  sessionMemoized: <T>(t: () => T) => T;
  sendMail: (
    p: Array<{
      email: string;
      subject: string;
      text: string;
      html: string;
    }>,
  ) => Promise<void>;
  sendSms: (p: { phoneNumber: string; body: string }) => Promise<void>;
  buildCoverAvatarUrl: (webCard: WebCard | null) => Promise<string | null>;
};

export const createGraphQLContext = (
  sendMail: GraphQLContext['sendMail'],
  sendSms: GraphQLContext['sendSms'],
  buildCoverAvatarUrl: GraphQLContext['buildCoverAvatarUrl'],
  locale: Locale = DEFAULT_LOCALE,
): Omit<GraphQLContext, 'auth'> => {
  const loaders = createLoaders();

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
    sendMail,
    sendSms,
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
  'CoverTemplate',
  'Media',
  'MediaSuggestion',
  'PostComment',
  'Post',
  'WebCardCategory',
  'Profile',
  'StaticMedia',
  'User',
  'WebCard',
] as const;

type Entity = (typeof entities)[number];

type EntityToType<T extends Entity> = {
  CardModule: CardModule;
  CardStyle: CardStyle;
  CardTemplate: CardTemplate;
  CardTemplateType: CardTemplateType;
  ColorPalette: ColorPalette;
  CompanyActivity: CompanyActivity;
  CoverTemplate: CoverTemplate;
  Media: Media;
  MediaSuggestion: MediaSuggestion;
  PostComment: PostComment;
  Post: Post;
  WebCardCategory: WebCardCategory;
  Profile: Profile;
  WebCard: WebCard;
  StaticMedia: StaticMedia;
  User: User;
}[T];

type Loaders = {
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
};

const entitiesTable = {
  CardModule: CardModuleTable,
  CardStyle: CardStyleTable,
  CardTemplate: CardTemplateTable,
  CardTemplateType: CardTemplateTypeTable,
  ColorPalette: ColorPaletteTable,
  CompanyActivity: CompanyActivityTable,
  CoverTemplate: CoverTemplateTable,
  Media: MediaTable,
  MediaSuggestion: MediaSuggestionTable,
  PostComment: PostCommentTable,
  Post: PostTable,
  WebCardCategory: WebCardCategoryTable,
  Profile: ProfileTable,
  WebCard: WebCardTable,
  StaticMedia: StaticMediaTable,
  User: UserTable,
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
      .select()
      .from(entitiesTable[entity])
      .where(eq(entitiesTable[entity].id, ids[0]));
    return [(entityById[0] as any) ?? null];
  }
  return sortEntitiesByIds(
    ids,
    (await db
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

const profileByWebCardIdAndUserIdLoader = () =>
  new DataLoader<{ userId: string; webCardId: string }, Profile | null, string>(
    async keys => {
      return Promise.all(
        keys.map(key => getUserProfileWithWebCardId(key.userId, key.webCardId)),
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

const createLoaders = (): Loaders =>
  new Proxy({} as Loaders, {
    get: (
      loaders: Loaders,
      entity:
        | Entity
        | 'profileByWebCardIdAndUserId'
        | 'profileStatistics'
        | 'webCardOwners'
        | 'webCardStatistics',
    ) => {
      if (entity === 'profileByWebCardIdAndUserId') {
        return profileByWebCardIdAndUserIdLoader();
      }

      if (entity === 'webCardStatistics') {
        return webCardStatisticsLoader();
      }

      if (entity === 'profileStatistics') {
        return profileStatisticsLoader();
      }

      if (entity === 'webCardOwners') {
        return webCardOwnerLoader();
      }

      if (!entities.includes(entity)) {
        throw new Error(`Unknown entity ${entity}`);
      }
      if (!loaders[entity]) {
        loaders[entity] = new DataLoader<string, EntityToType<Entity> | null>(
          ids => getEntitiesByIds(entity, ids),
          dataLoadersOptions,
        ) as any;
      }
      return loaders[entity];
    },
  });
