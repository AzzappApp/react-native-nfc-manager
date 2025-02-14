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
  fulltextIndex,
} from 'drizzle-orm/mysql-core';
import {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_VARCHAR_LENGTH,
} from './constants';
import sqliteCols from './sqliteCols';

const cols = {
  cuid: (name: string) => char(name, { length: 12 }),
  mediaId: (name: string) => char(name, { length: 14 }),
  lottieId: (name: string) => char(name, { length: 19 }),
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

if (process.env.SQL_ENV === 'SQLITE') Object.assign(cols, sqliteCols);

export default cols;
