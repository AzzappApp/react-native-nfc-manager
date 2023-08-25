import { connect } from '@planetscale/database';
import { sql as sqlDrizzle } from 'drizzle-orm';
import { char, datetime, varchar, json } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { createConcurrentQueue } from '@azzapp/shared/asyncHelpers';
import type { SQL } from 'drizzle-orm';

// see https://github.com/drizzle-team/drizzle-orm/issues/656
const sql = <T>(strings: TemplateStringsArray, ...params: any[]): SQL<T> => {
  return sqlDrizzle(strings, ...params);
};

const fetch =
  process.env.NEXT_RUNTIME !== 'edge'
    ? require('node-fetch')
    : globalThis.fetch;

const MAX_CONCURRENT_QUERIES = 20;

const concurrentQueue = createConcurrentQueue(MAX_CONCURRENT_QUERIES, () => {
  console.warn(
    `Maximum number of concurrent queries (${MAX_CONCURRENT_QUERIES}) reached`,
  );
});

// create the connection
const connection = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch(input: RequestInfo | URL, init: RequestInit | undefined) {
    return concurrentQueue(() => fetch(input, init)) as any;
  },
});

const db = drizzle(connection);

export const DEFAULT_VARCHAR_LENGTH = 191;

export const DEFAULT_DATETIME_PRECISION = 3;

export const DEFAULT_DATETIME_VALUE = sql`(CURRENT_TIMESTAMP(3))`;

export const cols = {
  cuid: (name: string) => char(name, { length: 24 }),
  defaultVarchar: (name: string) =>
    varchar(name, { length: DEFAULT_VARCHAR_LENGTH }),
  color: (name: string) => char(name, { length: 9 }),
  dateTime: (name: string, defaultNow: boolean) => {
    const col = datetime(name, {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    });
    return defaultNow ? col.default(DEFAULT_DATETIME_VALUE) : col;
  },
  labels: (name: string) => json(name).$type<{ [key: string]: string }>(),
};

export type DbTransaction =
  | Parameters<Parameters<typeof db.transaction>[0]>[0]
  | typeof db;

export default db;
