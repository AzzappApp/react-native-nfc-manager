import db from './db';

type EntityKind = 'Card' | 'CardCover' | 'Post' | 'User';

/**
 * Retrieves a list of entities by their ids.
 * @param kind - The entity type
 * @param ids - The ids of the entities to retrieve
 * @returns A list of entities, where the order of the entities matches the order of the ids
 */
export const getEntitiesByIds = async (
  kind: EntityKind,
  ids: readonly string[],
) => {
  if (ids.length === 0) {
    return [];
  } else if (ids.length === 1) {
    const item = await db
      .selectFrom(kind)
      .selectAll()
      .where('id', '=', ids[0])
      .executeTakeFirst();
    return [item ?? null];
  }
  const items = await db
    .selectFrom(kind)
    .selectAll()
    .where('id', 'in', ids)
    .execute();
  const itemsMap = new Map(items.map(user => [user.id, user]));

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
