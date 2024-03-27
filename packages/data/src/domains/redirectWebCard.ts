import { eq, type InferSelectModel } from 'drizzle-orm';
import { mysqlTable } from 'drizzle-orm/mysql-core';
import db, { cols, DEFAULT_DATETIME_VALUE } from './db';

export const RedirectWebCardTable = mysqlTable('RedirectWebCard', {
  fromUserName: cols.defaultVarchar('fromUserName').primaryKey().notNull(),
  toUserName: cols.defaultVarchar('toUserName').notNull(),
  createdAt: cols
    .dateTime('createdAt')
    .notNull()
    .default(DEFAULT_DATETIME_VALUE),
  expiresAt: cols
    .dateTime('expiresAt')
    .notNull()
    .default(DEFAULT_DATETIME_VALUE),
});

/**
 * Retrieves a webCard by their webCardname
 *
 * @param webCardName - The webCardname of the webCard to retrieve
 * @returns - The webCard if found, otherwise null
 */
export const getRedirectWebCardByUserName = async (userName: string) => {
  return db
    .select()
    .from(RedirectWebCardTable)
    .where(eq(RedirectWebCardTable.fromUserName, userName));
};

export const deleteRedirection = async (fromUserName: string) => {
  return db
    .delete(RedirectWebCardTable)
    .where(eq(RedirectWebCardTable.fromUserName, fromUserName));
};

export type RedirectWebCard = InferSelectModel<typeof RedirectWebCardTable>;
