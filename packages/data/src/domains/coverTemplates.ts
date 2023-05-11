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
  let request = db
    .selectFrom('CoverTemplate')
    .selectAll()
    .where('enabled', '=', true)
    .where('suggested', '=', false)
    .where('kind', '=', kind);
  if (segmented != null) {
    request = request.where('segmented', '=', segmented);
  }
  return request.execute();
};

/**
 * It retuens a promise that resolves to an array of suggested cover templates for a given profile kind and company activity id
 *
 * @param {string} companyActivityId
 * @return {*}  {Promise<CoverTemplate[]>}
 */
export const getCoverTemplatesSuggestion = (
  companyActivityId: string,
): Promise<CoverTemplate[]> => {
  return db
    .selectFrom('CoverTemplate')
    .selectAll()
    .where('enabled', '=', true)
    .where('suggested', '=', true)
    .where('kind', '=', 'business')
    .where(({ or, cmpr }) =>
      or([
        cmpr('companyActivityIds', 'in', [companyActivityId]),
        cmpr('companyActivityIds', 'is', null),
      ]),
    )
    .execute();
};
