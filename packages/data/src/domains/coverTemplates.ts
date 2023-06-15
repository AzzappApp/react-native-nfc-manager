import { eq, inArray, and, isNull, or } from 'drizzle-orm';
import {
  mysqlEnum,
  datetime,
  varchar,
  customType,
} from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
  mysqlTable,
} from './db';
import { customTinyInt, sortEntitiesByIds } from './generic';
import type { InferModel } from 'drizzle-orm';

type CoverTemplateData = {
  sourceMediaId?: string;
};

export const CoverTemplateTable = mysqlTable('CoverTemplate', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  name: varchar('name', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
  colorPalette: varchar('colorPalette', { length: DEFAULT_VARCHAR_LENGTH }),
  enabled: customTinyInt('enabled').default(true).notNull(),
  createdAt: datetime('createdAt', {
    mode: 'date',
    fsp: DEFAULT_DATETIME_PRECISION,
  })
    .default(DEFAULT_DATETIME_VALUE)
    .notNull(),
  updatedAt: datetime('updatedAt', {
    mode: 'date',
    fsp: DEFAULT_DATETIME_PRECISION,
  })
    .default(DEFAULT_DATETIME_VALUE)
    .notNull(),
  data: customType<{ data: CoverTemplateData }>({
    toDriver: value => JSON.stringify(value),
    fromDriver: value => value as CoverTemplateData,
    dataType: () => 'json',
  })('data').notNull(),
  merged: customTinyInt('merged').notNull(),
  segmented: customTinyInt('segmented').notNull(),
  tags: varchar('tags', { length: DEFAULT_VARCHAR_LENGTH }),
  category: customType<{ data: { en?: string } }>({
    toDriver: value => JSON.stringify(value),
    fromDriver: value => value as { en: string },
    dataType: () => 'json',
  })('category'),
  kind: mysqlEnum('kind', ['personal', 'business']).notNull(),
  previewMediaId: varchar('previewMediaId', { length: DEFAULT_VARCHAR_LENGTH }),
  suggested: customTinyInt('suggested').default(false).notNull(),
  companyActivityIds: varchar('companyActivityIds', {
    length: DEFAULT_VARCHAR_LENGTH,
  }),
});

export type CoverTemplate = InferModel<typeof CoverTemplateTable>;
export type NewCoverTemplate = InferModel<typeof CoverTemplateTable, 'insert'>;

/**
 * Retrireves a list of cover templates by their ids.
 *
 * @param {string[]} ids
 * @param {*} string
 * @param {*} []
 * @return {*}  {(Promise<Array<CoverTemplate>>)}
 */
export const getCoverTemplatesByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(CoverTemplateTable)
      .where(inArray(CoverTemplateTable.id, ids as string[])),
  );

/**
 * It returns a promise that resolves to an array of cover templates for a given profile kind
 * @param {ProfileKind} kind - ProfileKind
 */
export const getCoverTemplatesByKind = async (
  kind: CoverTemplate['kind'],
  segmented?: boolean | null,
) => {
  const res = await db
    .select()
    .from(CoverTemplateTable)
    .where(
      and(
        eq(CoverTemplateTable.enabled, true),
        eq(CoverTemplateTable.kind, kind),
        eq(CoverTemplateTable.suggested, false),
        segmented != null
          ? eq(CoverTemplateTable.segmented, !!segmented)
          : undefined,
      ),
    );
  return res;
};

/**
 * It retuens a promise that resolves to an array of suggested cover templates for a given profile kind and company activity id
 *
 * @param {string} companyActivityId
 * @return {*}  {Promise<CoverTemplate[]>}
 */
export const getCoverTemplatesSuggestion = async (
  companyActivityId: string,
) => {
  const res = await db
    .select()
    .from(CoverTemplateTable)
    .where(
      and(
        eq(CoverTemplateTable.enabled, true),
        eq(CoverTemplateTable.kind, 'business'),
        eq(CoverTemplateTable.suggested, true),
        or(
          isNull(CoverTemplateTable.companyActivityIds),
          inArray(CoverTemplateTable.companyActivityIds, [companyActivityId]),
        ),
      ),
    );
  return res;
};
