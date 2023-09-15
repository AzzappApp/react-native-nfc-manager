import { connect } from '@planetscale/database';
import { sql as sqlDrizzle } from 'drizzle-orm';
import { char, datetime, varchar, json } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import pLimit from 'p-limit';
import { monitorRequest, monitorRequestEnd } from './databaseMonitorer';
import type { SQL } from 'drizzle-orm';

// see https://github.com/drizzle-team/drizzle-orm/issues/656
const sql = <T>(strings: TemplateStringsArray, ...params: any[]): SQL<T> => {
  return sqlDrizzle(strings, ...params);
};

const fetchFunction =
  process.env.NEXT_RUNTIME !== 'edge' ? require('node-fetch') : fetch;

const MAX_CONCURRENT_QUERIES = 5;

const limit = pLimit(MAX_CONCURRENT_QUERIES);

export const ConnectionMonitorer = {
  concurrentRequestsCount: 0,
  queries: [] as any[],

  reset() {
    this.concurrentRequestsCount = 0;
    this.queries = [];
  },

  addQuery(query: any) {
    this.queries.push(query);
  },
  increaseConcurrentRequestsCount() {
    this.concurrentRequestsCount++;
    console.log('concurrentRequestsCount', this.concurrentRequestsCount);
  },
  decreaseConcurrentRequestsCount() {
    this.concurrentRequestsCount--;
  },
};

// create the connection
const connection = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  async fetch(input: RequestInfo | URL, init: RequestInit | undefined) {
    monitorRequest(init);

    let response: Response;
    try {
      if (process.env.NODE_ENV !== 'production') {
        response = await fetchFunction(input, init);
      } else {
        response = await limit(() => fetchFunction(input, init));
      }
    } catch (e) {
      throw e as any;
    } finally {
      monitorRequestEnd();
    }
    return response;
  },
});

const db = drizzle(connection);

export const DEFAULT_VARCHAR_LENGTH = 191;

export const DEFAULT_DATETIME_PRECISION = 3;

export const DEFAULT_DATETIME_VALUE = sql`(CURRENT_TIMESTAMP(3))`;

export const cols = {
  cuid: (name: string) => char(name, { length: 24 }),
  mediaId: (name: string) => char(name, { length: 26 }),
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
