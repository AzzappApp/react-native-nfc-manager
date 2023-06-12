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
