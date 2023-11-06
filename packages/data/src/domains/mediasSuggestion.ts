import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { mysqlTable } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { Media } from './medias';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const MediaSuggestionTable = mysqlTable('MediaSuggestion', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  mediaId: cols.mediaId('mediaId').notNull(),
  profileCategoryId: cols.cuid('profileCategoryId'),
  companyActivityId: cols.cuid('companyActivityId'),
});

export type MediaSuggestion = InferSelectModel<typeof MediaSuggestionTable>;
export type NewMediaSuggestion = InferInsertModel<typeof MediaSuggestionTable>;

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
  kind: 'image' | 'video',
  profileCategoryId: string,
  companyActivityId: string | null | undefined,
  offset?: string | null,
  limit?: number | null,
) => {
  // TODO perhaps we should have a property `kind` on MediaSuggestion
  const query = sql`
  SELECT Media.*, RAND(${randomSeed}) as cursor
  FROM MediaSuggestion 
  INNER JOIN Media ON MediaSuggestion.mediaId = Media.id
  WHERE Media.kind = ${kind} `;

  if (companyActivityId == null) {
    query.append(
      sql` AND MediaSuggestion.profileCategoryId = ${profileCategoryId}`,
    );
  } else {
    query.append(
      sql` AND MediaSuggestion.companyActivityId = ${companyActivityId}`,
    );
    //keep it for futur usage
    // query.append(
    //   sql` WHERE (profileCategoryId = ${profileCategoryId} AND companyActivityId IS NULL)
    //   OR (profileCategoryId IS NULL AND companyActivityId = ${companyActivityId} )
    //   OR (profileCategoryId = ${profileCategoryId} AND companyActivityId = ${companyActivityId})`,
    // );
  }
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }
  const rows = (await db.execute(query)).rows;
  return rows as Array<Media & { cursor: string }>;
};
//keep it. this request should group to make the search they want
// SELECT mediaId, GROUP_CONCAT(DISTINCT profileCategoryId) as profileCategoryIds, GROUP_CONCAT(DISTINCT companyActivityId) as companyActivityIds
// FROM MediaSuggestion
// GROUP BY mediaId;
