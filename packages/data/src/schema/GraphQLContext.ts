import DataLoader from 'dataloader';
import { eq, inArray } from 'drizzle-orm';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import {
  db,
  CardModuleTable,
  CardStyleTable,
  CardTemplateTable,
  ColorPaletteTable,
  CompanyActivityTable,
  CoverTemplateTable,
  MediaTable,
  MediaSuggestionTable,
  PostCommentTable,
  PostTable,
  ProfileCategoryTable,
  ProfileTable,
  StaticMediaTable,
  UserTable,
} from '#domains';
import { sortEntitiesByIds } from '#domains/generic';
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
  ColorPalette,
  CardModule,
  CompanyActivity,
  MediaSuggestion,
  ProfileCategory,
} from '#domains';

export type GraphQLContext = {
  cardUpdateListener: (username: string) => void;
  auth: {
    userId?: string;
    profileId?: string;
  };
  locale: string;
  loaders: Loaders;
  sessionMemoized: <T>(t: () => T) => T;
};

export const createGraphQLContext = (
  cardUpdateListener: (username: string) => void,
  userId?: string,
  profile?: Profile,
  locale: string = DEFAULT_LOCALE,
): GraphQLContext => {
  const loaders = createLoaders();
  if (profile && loaders.Profile) {
    loaders.Profile.prime(profile.id, profile);
  }

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
    auth: {
      userId,
      profileId: profile?.id,
    },
    locale,
    cardUpdateListener,
    loaders,
    sessionMemoized,
  };
};

const entities = [
  'CardModule',
  'CardStyle',
  'CardTemplate',
  'ColorPalette',
  'CompanyActivity',
  'CoverTemplate',
  'Media',
  'MediaSuggestion',
  'PostComment',
  'Post',
  'ProfileCategory',
  'Profile',
  'StaticMedia',
  'User',
] as const;

type Entity = (typeof entities)[number];

type EntityToType<T extends Entity> = {
  CardModule: CardModule;
  CardStyle: CardStyle;
  CardTemplate: CardTemplate;
  ColorPalette: ColorPalette;
  CompanyActivity: CompanyActivity;
  CoverTemplate: CoverTemplate;
  Media: Media;
  MediaSuggestion: MediaSuggestion;
  PostComment: PostComment;
  Post: Post;
  ProfileCategory: ProfileCategory;
  Profile: Profile;
  StaticMedia: StaticMedia;
  User: User;
}[T];

type Loaders = {
  [T in Entity]: DataLoader<string, EntityToType<T> | null>;
};

const entitiesTable = {
  CardModule: CardModuleTable,
  CardStyle: CardStyleTable,
  CardTemplate: CardTemplateTable,
  ColorPalette: ColorPaletteTable,
  CompanyActivity: CompanyActivityTable,
  CoverTemplate: CoverTemplateTable,
  Media: MediaTable,
  MediaSuggestion: MediaSuggestionTable,
  PostComment: PostCommentTable,
  Post: PostTable,
  ProfileCategory: ProfileCategoryTable,
  Profile: ProfileTable,
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

const dataloadersOptions = {
  batchScheduleFn: setTimeout,
};

const createLoaders = (): Loaders =>
  new Proxy({} as Loaders, {
    get: (loaders: Loaders, entity: Entity) => {
      if (!entities.includes(entity)) {
        throw new Error(`Unknown entity ${entity}`);
      }
      if (!loaders[entity]) {
        loaders[entity] = new DataLoader<string, EntityToType<Entity> | null>(
          ids => getEntitiesByIds(entity, ids),
          dataloadersOptions,
        ) as any;
      }
      return loaders[entity];
    },
  });
