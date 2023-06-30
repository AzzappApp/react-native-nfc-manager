import { connect } from '@planetscale/database';
import { sql as sqlDrizzle } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import type { SQL } from 'drizzle-orm';

// see https://github.com/drizzle-team/drizzle-orm/issues/656
const sql = <T>(strings: TemplateStringsArray, ...params: any[]): SQL<T> => {
  return sqlDrizzle(strings, ...params);
};

// create the connection
const connection = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch(input: RequestInfo | URL, init: RequestInit | undefined) {
    return fetch(input, { ...init, cache: 'no-store' });
  },
});

const db = drizzle(connection);

export const DEFAULT_VARCHAR_LENGTH = 191;

export const DEFAULT_DATETIME_PRECISION = 3;

export const DEFAULT_DATETIME_VALUE = sql`(CURRENT_TIMESTAMP(3))`;

export type DbTransaction =
  | Parameters<Parameters<typeof db.transaction>[0]>[0]
  | typeof db;

export default db;
