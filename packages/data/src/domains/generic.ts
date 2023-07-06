import { customType } from 'drizzle-orm/mysql-core';

export const customLabels = (name: string) =>
  customType<{ data: { [key: string]: string } }>({
    toDriver: value => JSON.stringify(value),
    fromDriver: value => value as { en: string },
    dataType: () => 'json',
  })(name).notNull();

export const customTinyInt = (name: string) =>
  customType<{ data: boolean; driverData: 0 | 1 }>({
    toDriver: value => (value ? 1 : 0),
    fromDriver: value => Boolean(value),
    dataType: () => 'tinyint(1)',
  })(name);

export const sortEntitiesByIds = <IDType, T extends { id: IDType }>(
  ids: readonly IDType[],
  entities: T[],
) => {
  const map = new Map(entities.map(entity => [entity.id, entity]));
  return ids.map(id => map.get(id) ?? null);
};
