/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/consistent-type-imports */
// import { Client } from '@planetscale/database';
import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  varchar,
  json,
  mysqlEnum,
  int,
  boolean,
  index,
  mysqlTable,
  smallint,
  primaryKey,
  double,
  text,
  uniqueIndex,
  date,
  // @ts-ignore Missing type for fulltextIndex
  fulltextIndex,
} from 'drizzle-orm/mysql-core';
import { DEFAULT_VARCHAR_LENGTH } from '#helpers/constants';
import { createDrizzleService } from './drizzle.service';
import { SQLiteCols } from './helpers/cols';

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
// const connection = new Client({
//   host: process.env.DATABASE_HOST,
//   username: process.env.DATABASE_USERNAME,
//   password: process.env.DATABASE_PASSWORD,
//   async fetch(input: RequestInfo | URL, init: RequestInit | undefined) {
//     if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
//       monitorRequest(init);
//     }
//     let response: Response;
//     try {
//       response = await fetchFunction(input, init);
//     } catch (e) {
//       throw e as any;
//     } finally {
//       if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
//         monitorRequestEnd();
//       }
//     }
//     return response;
//   },
// });

// const db = drizzle(connection);
const db = createDrizzleService();

const DEFAULT_DATETIME_PRECISION = 3;

export const DEFAULT_DATETIME_VALUE = sql`CURRENT_TIMESTAMP(3)`;

const cols = {
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
  enum: mysqlEnum,
  json,
  int,
  boolean,
  index,
  table: mysqlTable,
  smallint,
  primaryKey,
  double,
  text,
  varchar,
  uniqueIndex,
  date,
  fulltextIndex,
};

if (process.env.SQL_ENV === 'SQLITE') Object.assign(cols, SQLiteCols);

export type DbTransaction =
  | Parameters<Parameters<typeof db.transaction>[0]>[0]
  | typeof db;

export default db;

export { cols };
