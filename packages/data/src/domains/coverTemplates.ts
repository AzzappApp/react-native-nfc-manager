import { inArray, sql } from 'drizzle-orm';
import {
  mysqlTable,
  mysqlEnum,
  boolean,
  json,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import { sortEntitiesByIds } from './generic';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { InferModel } from 'drizzle-orm';

export type CoverTemplateData = {
  titleStyle?: TextStyle | null;
  subTitleStyle?: TextStyle | null;
  textOrientation: TextOrientation;
  textPosition: TextPosition;
  backgroundId?: string | null;
  backgroundColor?: string | null;
  backgroundPatternColor?: string | null;
  foregroundId?: string | null;
  foregroundColor?: string | null;
  mediaFilter?: string | null;
  mediaParameters?: Record<string, any> | null;
  merged: boolean;
};

export const CoverTemplateTable = mysqlTable('CoverTemplate', {
  id: cols.cuid('id').notNull().primaryKey(),
  name: cols.defaultVarchar('name').notNull(),
  kind: mysqlEnum('kind', ['people', 'video', 'others']).notNull(),
  previewMediaId: cols.cuid('previewMediaId').notNull(),
  data: json('data').$type<CoverTemplateData>().notNull(),
  colorPaletteId: cols.cuid('colorPaletteId').notNull(),
  businessEnabled: boolean('businessEnabled').default(true).notNull(),
  personalEnabled: boolean('personalEnabled').default(true).notNull(),
});

export type CoverTemplate = InferModel<typeof CoverTemplateTable>;
export type NewCoverTemplate = InferModel<typeof CoverTemplateTable, 'insert'>;

/**
 * Retrireves a list of cover templates by their ids.
 *
 * @param {string[]} ids
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
 * Return a list of cover templates. filtered by profile kind and template kind
 * @param profileKind the profile kind to filter by
 * @param templateKind the template kind to filter by
 * @param randomSeed the random seed to use for random ordering
 * @param offset the offset to use for pagination
 * @param limit the limit to use for pagination
 * @return {*}  {Promise<Array<CoverTemplate & { cursor: string }>>}
 */
export const getCoverTemplates = async (
  profileKind: 'business' | 'personal',
  templateKind: 'others' | 'people' | 'video',
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
) => {
  const query = sql`
    SELECT *, RAND(${randomSeed}) as cursor
    FROM CoverTemplate
    WHERE ${
      profileKind === 'business'
        ? CoverTemplateTable.businessEnabled
        : CoverTemplateTable.personalEnabled
    } = 1
    AND ${CoverTemplateTable.kind} = ${templateKind}
    ${offset ? sql`AND cursor > ${offset}` : sql``}
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return (await db.execute(query)).rows as Array<
    CoverTemplate & { cursor: string }
  >;
};
