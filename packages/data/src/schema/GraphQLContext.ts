import DataLoader from 'dataloader';
import { eq, inArray } from 'drizzle-orm';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
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
} from '#domains';
import { sortEntitiesByIds } from '#domains/generic';
import { WebCardTable } from '#domains/webCards';
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
} from '#domains';

export type GraphQLContext = {
  cardUsernamesToRevalidate: Set<string>;
  auth: {
    userId?: string;
    profileId?: string;
  };
  locale: string;
  loaders: Loaders;
  sessionMemoized: <T>(t: () => T) => T;
  sendMail: (p: {
    email: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<void>;
  sendSms: (p: { phoneNumber: string; body: string }) => Promise<void>;
};

export const createGraphQLContext = (
  sendMail: GraphQLContext['sendMail'],
  sendSms: GraphQLContext['sendSms'],
  locale = DEFAULT_LOCALE,
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
    loaders,
    sessionMemoized,
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

const createLoaders = (): Loaders =>
  new Proxy({} as Loaders, {
    get: (loaders: Loaders, entity: Entity) => {
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
