import { connect } from '@planetscale/database';
import { sql as sqlDrizzle } from 'drizzle-orm';

import { mysqlTable as mysqlTableDrizzle } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import type { BuildColumns, SQL } from 'drizzle-orm';
import type {
  MySqlTableWithColumns,
  AnyMySqlColumnBuilder,
  MySqlTableExtraConfig,
} from 'drizzle-orm/mysql-core';

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

export type MysqlTableResult<
  TName extends string,
  TColumnsMap extends Record<string, AnyMySqlColumnBuilder>,
> = MySqlTableWithColumns<{
  name: TName;
  schema: undefined;
  columns: BuildColumns<TName, TColumnsMap>;
}>;

export type Table<
  TableName extends string,
  TConfigMap extends Record<string, AnyMySqlColumnBuilder>,
> = MySqlTableWithColumns<{
  name: TableName;
  schema: undefined;
  columns: BuildColumns<TableName, TConfigMap>;
}>;

export const mysqlTable = <
  TableName extends string,
  TConfigMap extends Record<string, AnyMySqlColumnBuilder>,
>(
  table: TableName,
  columns: TConfigMap,
  extraConfig?: (
    self: BuildColumns<TableName, TConfigMap>,
  ) => MySqlTableExtraConfig,
): Table<TableName, TConfigMap> =>
  mysqlTableDrizzle(table, columns, extraConfig);

export default db;
