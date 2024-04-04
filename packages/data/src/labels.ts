import { eq, inArray, sql } from 'drizzle-orm';
import { mysqlTable } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferSelectModel } from 'drizzle-orm';

export const LabelTable = mysqlTable('Label', {
  labelKey: cols.defaultVarchar('labelKey').notNull().primaryKey(),
  baseLabelValue: cols.defaultVarchar('baseLabelValue').notNull().default(''),
  translations: cols.labels('translations').notNull(),
});

export type Label = InferSelectModel<typeof LabelTable>;

export const updateLabel = async (
  labelKey: string,
  languageKey: string,
  translation: string,
  trx: DbTransaction = db,
) => {
  const query = `UPDATE Label SET translations=json_set(translations, '$."${languageKey}"', "${translation}") WHERE labelKey = "${labelKey}"`;

  await trx.execute(sql.raw(query));
};

export const getLabel = async (labelKey: string) =>
  db
    .select()
    .from(LabelTable)
    .where(eq(LabelTable.labelKey, labelKey))
    .then(res => res.pop() ?? null);

export const createLabel = async (label: Label, trx: DbTransaction = db) => {
  return trx
    .insert(LabelTable)
    .values(label)
    .onDuplicateKeyUpdate({
      set: {
        baseLabelValue: label.baseLabelValue,
      },
    });
};

export const getLabels = async (labelKeys: string[]) =>
  db.select().from(LabelTable).where(inArray(LabelTable.labelKey, labelKeys));
