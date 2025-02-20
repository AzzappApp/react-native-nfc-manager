import { desc, eq } from 'drizzle-orm';
import { db } from '../database';
import { TermsOfUseTable, type TermsOfUse } from '../schema';

/**
 * Retrieve an Terms Of Use by its version
 *
 * @param version - the version of the TermsOfUse to retrieve
 * @returns The TermsOfUse if found, otherwise null
 */
export const getTermsOfUseByVersion = (
  version: string,
): Promise<TermsOfUse | null> =>
  db()
    .select()
    .from(TermsOfUseTable)
    .where(eq(TermsOfUseTable.version, version))
    .then(res => res[0] ?? null);

/**
 * Retrieve all Terms Of Use ordered by creation date
 */
export const getTermsOfUse = (): Promise<TermsOfUse[]> =>
  db().select().from(TermsOfUseTable).orderBy(desc(TermsOfUseTable.createdAt));

/**
 * Retrieve last Terms Of Use
 */
export const getLastTermsOfUse = (): Promise<TermsOfUse | null> =>
  db()
    .select()
    .from(TermsOfUseTable)
    .orderBy(desc(TermsOfUseTable.createdAt))
    .limit(1)
    .then(res => res[0] ?? null);

/**
 * Create a new version
 *
 * @param newVersion - The new version field
 */
export const createTermsOfUse = (version: string) =>
  db().insert(TermsOfUseTable).values({
    version,
  });
