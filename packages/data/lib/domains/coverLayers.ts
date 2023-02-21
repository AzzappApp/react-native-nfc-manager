import db from './db';
import type { CoverLayer } from '@prisma/client';

/**
 * Retrieves all cover foregrounds in the database.
 * @returns A list of cover foregrounds.
 */
export const getCoverLayerById = (id: string): Promise<CoverLayer | null> =>
  db
    .selectFrom('CoverLayer')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
    .then(result => result ?? null);

/**
 * Retrieves all cover foregrounds in the database.
 * @returns A list of cover foregrounds.
 */
export const getCoverLayers = (
  kind: 'background' | 'foreground',
): Promise<CoverLayer[]> =>
  db.selectFrom('CoverLayer').where('kind', '=', kind).selectAll().execute();
