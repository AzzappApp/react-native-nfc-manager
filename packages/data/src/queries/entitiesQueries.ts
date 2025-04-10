import { eq, inArray } from 'drizzle-orm';
import { db } from '../database';
import {
  CardModuleTable,
  CardStyleTable,
  CardTemplateTable,
  CardTemplateTypeTable,
  ColorPaletteTable,
  WebCardTable,
  CoverTemplateTable,
  CoverTemplateTagTable,
  CoverTemplateTypeTable,
  MediaTable,
  ModuleBackgroundTable,
  PaymentMeanTable,
  PaymentTable,
  PostCommentTable,
  PostTable,
  ProfileTable,
  UserTable,
  WebCardCategoryTable,
} from '../schema';
import type {
  CardModule,
  CardStyle,
  CardTemplate,
  CardTemplateType,
  ColorPalette,
  CoverTemplate,
  CoverTemplateType,
  CoverTemplateTag,
  Media,
  PostComment,
  Post,
  WebCardCategory,
  Profile,
  WebCard,
  ModuleBackground,
  User,
  Payment,
  PaymentMean,
  // A little bit of a hack to get the types to work from outside the package
  // warning : do not fix this import unless you check the types are still working
  // and are not transformed to any
} from '../schema';

export const ENTITIES = [
  'CardModule',
  'CardStyle',
  'CardTemplate',
  'CardTemplateType',
  'ColorPalette',
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

export type Entity = (typeof ENTITIES)[number];

export type EntityToType<T extends Entity> = {
  CardModule: CardModule;
  CardStyle: CardStyle;
  CardTemplate: CardTemplate;
  CardTemplateType: CardTemplateType;
  ColorPalette: ColorPalette;
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

const entitiesTable = {
  CardModule: CardModuleTable,
  CardStyle: CardStyleTable,
  CardTemplate: CardTemplateTable,
  CardTemplateType: CardTemplateTypeTable,
  ColorPalette: ColorPaletteTable,
  CoverTemplate: CoverTemplateTable,
  CoverTemplateType: CoverTemplateTypeTable,
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

export const sortEntitiesByIds = <IDType, T extends { id: IDType }>(
  ids: readonly IDType[],
  entities: T[],
) => {
  const map = new Map(entities.map(entity => [entity.id, entity]));
  return ids.map(id => map.get(id) ?? null);
};

export const getEntitiesByIds = async <T extends Entity>(
  entity: T,
  ids: readonly string[],
): Promise<Array<EntityToType<T> | null>> => {
  if (ids.length === 0) {
    return [];
  }
  if (ids.length === 1) {
    const entityById = await db()
      .select()
      .from(entitiesTable[entity])
      .where(eq(entitiesTable[entity].id, ids[0]));
    return [(entityById[0] as any) ?? null];
  }

  return sortEntitiesByIds(
    ids,
    (await db()
      .select()
      .from(entitiesTable[entity])
      .where(inArray(entitiesTable[entity].id, ids as string[]))) as Array<
      EntityToType<Entity>
    >,
  ) as any;
};
