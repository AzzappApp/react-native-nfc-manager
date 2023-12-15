import { createId } from '@paralleldrive/cuid2';
import { eq, sql } from 'drizzle-orm';
import { mysqlTable, mysqlEnum, boolean, json } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type CoverTemplateData = {
  titleStyle?: TextStyle | null;
  subTitleStyle?: TextStyle | null;
  textOrientation: TextOrientation;
  textPosition: TextPosition;
  textAnimation?: string | null;
  backgroundId?: string | null;
  backgroundColor?: string | null;
  backgroundPatternColor?: string | null;
  foregroundId?: string | null;
  foregroundColor?: string | null;
  mediaFilter?: string | null;
  mediaParameters?: Record<string, any> | null;
  mediaAnimation?: string | null;
  merged: boolean;
};

export const CoverTemplateTable = mysqlTable('CoverTemplate', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  name: cols.defaultVarchar('name').notNull(),
  kind: mysqlEnum('kind', ['people', 'video', 'others']).notNull(),
  previewMediaId: cols.mediaId('previewMediaId').notNull(),
  data: json('data').$type<CoverTemplateData>().notNull(),
  colorPaletteId: cols.cuid('colorPaletteId').notNull(),
  businessEnabled: boolean('businessEnabled').default(true).notNull(),
  personalEnabled: boolean('personalEnabled').default(true).notNull(),
});

export type CoverTemplate = InferSelectModel<typeof CoverTemplateTable>;
export type NewCoverTemplate = InferInsertModel<typeof CoverTemplateTable>;

/**
 * Retrieve a coverTemplate by its id.
 * @param id - The id of the coverTemplate to retrieve
 * @returns the coverTemplate, or null if no cardTemplate was found
 */
export const getCoverTemplateById = (id: string) =>
  db
    .select()
    .from(CoverTemplateTable)
    .where(eq(CoverTemplateTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Return a list of cover templates. filtered by profile kind and template kind
 * @param webCardKind the webCard kind to filter by
 * @param templateKind the template kind to filter by
 * @param randomSeed the random seed to use for random ordering
 * @param offset the offset to use for pagination
 * @param limit the limit to use for pagination
 * @return {*}  {Promise<Array<CoverTemplate & { cursor: string }>>}
 */
export const getCoverTemplates = async (
  webCardKind: 'business' | 'personal',
  templateKind: 'others' | 'people' | 'video',
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
) => {
  const query = sql`
    SELECT *, RAND(${randomSeed}) as cursor
    FROM CoverTemplate
    WHERE ${
      webCardKind === 'business'
        ? CoverTemplateTable.businessEnabled
        : CoverTemplateTable.personalEnabled
    } = 1
    AND ${CoverTemplateTable.kind} = ${templateKind}`;
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }

  return (await db.execute(query)).rows as Array<
    CoverTemplate & { cursor: string }
  >;
};
