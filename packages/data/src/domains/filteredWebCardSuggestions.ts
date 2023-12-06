import { mysqlTable, primaryKey } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const FilteredWebCardSuggestionTable = mysqlTable(
  'FilteredWebCardSuggestion',
  {
    profileId: cols.cuid('profileId').notNull(),
    webCardId: cols.cuid('webCardId').notNull(),
  },
  table => {
    return {
      filterWebCardSuggestionProfileIdWebCardId: primaryKey(
        table.profileId,
        table.webCardId,
      ),
    };
  },
);

export const addFilteredWebCardSuggestion = async (
  profileId: string,
  webCardId: string,
  trx: DbTransaction = db,
) =>
  trx
    .insert(FilteredWebCardSuggestionTable)
    .values({
      profileId,
      webCardId,
    })
    .onDuplicateKeyUpdate({ set: { webCardId } });
