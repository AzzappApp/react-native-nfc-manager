import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { InferModel } from 'drizzle-orm';

export const MediaSuggestionTable = mysqlTable('MediaSuggestion', {
  id: cols.cuid('id').notNull().primaryKey(),
  mediaId: cols.mediaId('mediaId').notNull(),
  profileCategoryId: cols.cuid('profileCategoryId'),
  companyActivityId: cols.cuid('companyActivityId'),
});

export type MediaSuggestion = InferModel<typeof MediaSuggestionTable>;
export type NewMediaSuggestion = InferModel<
  typeof MediaSuggestionTable,
  'insert'
>;

/**
 * Return a list of media suggestions. filtered by profile kind and template kind
 * @param profileCategoryId the profile catetgory Id
 * @param companyActivityId tue company activity
 * @param randomSeed the random seed to use for random ordering
 * @param offset the offset to use for pagination
 * @param limit the limit to use for pagination
 * @return {*}  {Promise<Array<MediaSuggestion & { cursor: string }>>}
 */
export const getMediaSuggestions = async (
  randomSeed: string,
  profileCategoryId: string,
  companyActivityId: string | null | undefined,
  offset?: string | null,
  limit?: number | null,
) => {
  const query = sql`
  SELECT *, RAND(${randomSeed}) as cursor
  FROM MediaSuggestion `;
  if (!companyActivityId) {
    query.append(sql` WHERE profileCategoryId = ${profileCategoryId} `);
  } else {
    query.append(
      sql` WHERE (profileCategoryId = ${profileCategoryId} AND companyActivityId IS NULL) 
      OR (profileCategoryId IS NULL AND companyActivityId = ${companyActivityId} ) 
      OR (profileCategoryId = ${profileCategoryId} AND companyActivityId = ${companyActivityId})`,
    );
  }
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }
  return (await db.execute(query)).rows as Array<
    MediaSuggestion & { cursor: string }
  >;
};
