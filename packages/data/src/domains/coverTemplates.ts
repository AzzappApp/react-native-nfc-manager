import db from './db';
import { getEntitiesByIds } from './generic';
import type { CoverTemplate, ProfileKind } from '@prisma/client';
/**
 * Retrireves a list of cover templates by their ids.
 *
 * @param {readonly} ids
 * @param {*} string
 * @param {*} []
 * @return {*}  {(Promise<Array<CoverTemplate | null>>)}
 */
export const getCoverTemplatesByIds = (
  ids: readonly string[],
): Promise<Array<CoverTemplate | null>> => {
  return getEntitiesByIds('CoverTemplate', ids, 'id');
};

/**
 * It returns a promise that resolves to an array of cover templates for a given profile kind
 * @param {ProfileKind} kind - ProfileKind
 */
export const getCoverTemplatesByKind = (
  kind: ProfileKind,
  segmented?: boolean,
): Promise<CoverTemplate[]> => {
  const request = db.selectFrom('CoverTemplate').where('enabled', '=', true);
  if (segmented) {
    request.where('segmented', '=', segmented);
  }
  return request.where('kind', '=', kind).selectAll().execute();
};
