import { and, desc, eq, type InferModel } from 'drizzle-orm';
import {
  datetime,
  mysqlTable,
  varchar,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
  index,
} from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';

export const TokenTable = mysqlTable(
  'Token',
  {
    userId: varchar('userId', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    issuer: varchar('issuer', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    value: varchar('value', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
  },
  table => {
    return {
      tokenIdIdx: index('Token_value_idx').on(table.value, table.issuer),
    };
  },
);

export type Token = InferModel<typeof TokenTable>;
export type NewToken = InferModel<typeof TokenTable, 'insert'>;

export const createToken = async (token: NewToken) =>
  db.insert(TokenTable).values(token);

export const getToken = async (id: string) =>
  (
    await db
      .select()
      .from(TokenTable)
      .where(eq(TokenTable.userId, id))
      .orderBy(desc(TokenTable.createdAt))
  ).pop();

export const deleteToken = async (id: string) =>
  db.delete(TokenTable).where(eq(TokenTable.userId, id));

export const getByTokenValue = async (value: string, issuer: string) =>
  (
    await db
      .select()
      .from(TokenTable)
      .where(and(eq(TokenTable.value, value), eq(TokenTable.issuer, issuer)))
      .orderBy(desc(TokenTable.createdAt))
  ).pop();
