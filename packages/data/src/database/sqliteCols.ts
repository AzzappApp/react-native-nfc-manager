import { sql } from 'drizzle-orm';
import {
  customType,
  index,
  int,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const customBoolean = customType<{ data: boolean }>({
  dataType() {
    return 'boolean';
  },
  fromDriver(value: unknown) {
    return Boolean(value as number);
  },
  toDriver(value: boolean) {
    return Number(value);
  },
});

const customDate = customType<{ data: Date }>({
  dataType() {
    return 'date';
  },
  fromDriver(value: unknown) {
    return new Date(value as string);
  },
  toDriver(value: Date) {
    return value.toISOString();
  },
});

const sqliteCols = {
  cuid: (name: string) => text(name, { length: 24 }),
  mediaId: (name: string) => text(name, { length: 26 }),
  defaultVarchar: (name: string) => text(name, { length: 191 }),
  color: (name: string) => text(name, { length: 9 }),
  dateTime: (name: string) => {
    const mockDateTime = customDate(name).default(sql`current_timestamp`);
    Object.assign(mockDateTime, { default: () => mockDateTime });
    return mockDateTime;
  },
  labels: (name: string) =>
    text(name, { mode: 'json' }).$type<{
      [key: string]: string;
    }>(),
  enum: (id: string, enums: string[]) => text(id, { enum: enums as any }),
  json: (id: string) => text(id, { mode: 'json' }),
  int,
  boolean: customBoolean,
  index,
  table: sqliteTable,
  smallint: int,
  primaryKey,
  double: real,
  text,
  varchar: text,
  uniqueIndex,
  date: (name: string) => customDate(name).default(sql`current_date`),
  fulltextIndex: index,
};

export default sqliteCols;
