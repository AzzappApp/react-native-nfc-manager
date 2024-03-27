/* eslint-disable @typescript-eslint/consistent-type-imports */
import { connect } from '@planetscale/database';
import { sql } from 'drizzle-orm';
import { char, datetime, varchar, json } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { monitorRequest, monitorRequestEnd } from './databaseMonitorer';

let fetchFunction: typeof fetch;

if (process.env.NEXT_RUNTIME !== 'edge') {
  let nodeFetch: typeof import('node-fetch');
  fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!nodeFetch) {
      nodeFetch = await import('node-fetch');
    }
    return nodeFetch.default(input as any, init as any) as any;
  };
} else {
  fetchFunction = fetch;
}

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
    if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
      monitorRequest(init);
    }
    let response: Response;
    try {
      response = await fetchFunction(input, init);
    } catch (e) {
      throw e as any;
    } finally {
      if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
        monitorRequestEnd();
      }
    }
    return response;
  },
});

const db = drizzle(connection);

export const DEFAULT_VARCHAR_LENGTH = 191;

const DEFAULT_DATETIME_PRECISION = 3;

export const DEFAULT_DATETIME_VALUE = sql`CURRENT_TIMESTAMP(3)`;

export const cols = {
  cuid: (name: string) => char(name, { length: 24 }),
  mediaId: (name: string) => char(name, { length: 26 }),
  defaultVarchar: (name: string) =>
    varchar(name, { length: DEFAULT_VARCHAR_LENGTH }),
  color: (name: string) => char(name, { length: 9 }),
  dateTime: (name: string) =>
    datetime(name, {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    }),
  labels: (name: string) => json(name).$type<{ [key: string]: string }>(),
};

export type DbTransaction =
  | Parameters<Parameters<typeof db.transaction>[0]>[0]
  | typeof db;

export default db;
