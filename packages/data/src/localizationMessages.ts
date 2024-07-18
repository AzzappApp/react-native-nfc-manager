import { and, eq, inArray, type InferSelectModel } from 'drizzle-orm';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const LocalizationMessageTable = cols.table(
  'LocalizationMessage',
  {
    key: cols.defaultVarchar('key').notNull(),
    locale: cols.defaultVarchar('locale').notNull(),
    target: cols.defaultVarchar('target').notNull(),
    value: cols.text('value').notNull(),
  },
  table => {
    return {
      localizationMessageId: cols.primaryKey({
        columns: [table.key, table.locale, table.target],
      }),
      targetKey: cols.index('LocalizationMessage_key').on(table.target),
    };
  },
);

export type LocalizationMessage = InferSelectModel<
  typeof LocalizationMessageTable
>;

export const getLocalizationMessages = async (): Promise<
  LocalizationMessage[]
> => {
  return db.select().from(LocalizationMessageTable);
};

export const getLocalizationMessagesByKeys = async (
  keys: string[],
  locale: string,
  target: string,
): Promise<LocalizationMessage[]> => {
  return db
    .select()
    .from(LocalizationMessageTable)
    .where(
      and(
        eq(LocalizationMessageTable.target, target),
        eq(LocalizationMessageTable.locale, locale),
        inArray(LocalizationMessageTable.key, keys),
      ),
    );
};

export const getEntityLabels = async (): Promise<LocalizationMessage[]> => {
  return db.select().from(LocalizationMessageTable);
};

export const getLocalizationMessagesByLocale = async (
  locale: string,
): Promise<LocalizationMessage[]> => {
  return db
    .select()
    .from(LocalizationMessageTable)
    .where(eq(LocalizationMessageTable.locale, locale));
};

export const getLocalizationMessagesByLocaleAndTarget = async (
  locale: string,
  target: string,
): Promise<LocalizationMessage[]> => {
  return db
    .select()
    .from(LocalizationMessageTable)
    .where(
      and(
        eq(LocalizationMessageTable.locale, locale),
        eq(LocalizationMessageTable.target, target),
      ),
    );
};

export const saveLocalizationMessage = async (
  message: LocalizationMessage,
  tx: DbTransaction = db,
) =>
  tx
    .insert(LocalizationMessageTable)
    .values(message)
    .onDuplicateKeyUpdate({
      set: { value: message.value },
    });
