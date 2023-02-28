import has from 'lodash/has';
import db from './db';
import type {
  Card,
  CardCover,
  Media,
  Post,
  Prisma,
  Profile,
  User,
} from '@prisma/client';
import type { ColumnType } from 'kysely';

type EntityKind = 'Card' | 'CardCover' | 'Media' | 'Post' | 'Profile' | 'User';

type EntityKindToEntity<T extends EntityKind> = T extends 'Card'
  ? Card
  : T extends 'CardCover'
  ? CardCover
  : T extends 'Media'
  ? Media
  : T extends 'Post'
  ? Post
  : T extends 'Profile'
  ? Profile
  : User;

/**
 * Retrieves a list of entities by their ids.
 * @param kind - The entity type
 * @param ids - The ids of the entities to retrieve
 * @returns A list of entities, where the order of the entities matches the order of the ids
 */
export const getEntitiesByIds = async <
  K extends EntityKind,
  R = EntityKindToEntity<K>,
>(
  kind: K,
  ids: readonly string[],
  idField = 'id',
): Promise<Array<R | null>> => {
  // TODO why all the casts are needed?
  if (ids.length === 0) {
    return [];
  } else if (ids.length === 1) {
    const item = await db
      .selectFrom(kind)
      .selectAll()
      .where(idField as any, '=', ids[0] as any)
      .executeTakeFirst();
    return [item ?? null] as any;
  }
  const items = (await db
    .selectFrom(kind)
    .selectAll()
    .where(idField as any, 'in', ids as any)
    .execute()) as any[];
  const itemsMap = new Map(items.map(item => [item.id, item]));

  return ids.map(id => itemsMap.get(id) ?? null);
};

/**
 * Converts a SQL count to a number.
 * @param count - The count to convert
 * @returns The count as a number
 */
export const sqlCountToNumber = (count: bigint | number | string) => {
  if (typeof count === 'string') {
    return parseInt(count, 10);
  }
  if (typeof count === 'bigint') {
    return Number(count);
  }
  return count;
};

export const jsonFieldSerializer =
  <JSONFields extends string>(jsonFields: readonly JSONFields[]) =>
  <T extends Partial<Record<JSONFields, Prisma.JsonValue>>>(
    entity: T,
  ): WithoutJSONFields<T, JSONFields> => {
    const serializedEntity = { ...entity };
    for (const jsonField of jsonFields) {
      if (has(serializedEntity, jsonField)) {
        const value = serializedEntity[jsonField];
        serializedEntity[jsonField] =
          value != null ? (JSON.stringify(value) as any) : null;
      }
    }
    return serializedEntity as any;
  };

export type WithCreatedAt<T extends { createdAt: Date }> = Exclude<
  T,
  'createdAt'
> & {
  createdAt: ColumnType<Date, never, never>;
};

export type WithTimeStamps<T extends { createdAt: Date; updatedAt: Date }> =
  Exclude<T, 'createdAt' | 'updatedAt'> & {
    createdAt: ColumnType<Date, never, never>;
    updatedAt: ColumnType<Date, never, Date>;
  };

export type WithoutJSONFields<T, JSONFields extends keyof T> = {
  [K in keyof T]: K extends JSONFields
    ? T[K] extends undefined
      ? string | null | undefined
      : string
    : T[K];
};
