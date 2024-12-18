import { and, eq } from 'drizzle-orm';
import { db } from '../database';
import { RedirectWebCardTable } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Creates a redirection between two usernames
 *
 * @param fromUserName - The username to redirect from
 * @param toUserName - The username to redirect to
 */
export const createRedirectWebCard = async (
  redirection: InferInsertModel<typeof RedirectWebCardTable>,
) => {
  await db().insert(RedirectWebCardTable).values(redirection);
};

/**
 * Retrieves a redirection by username
 *
 * @param username - The username of the redirection to search
 * @returns - The redirection if it exists
 */
export const getRedirectWebCardByUserName = async (userName: string) => {
  return db()
    .select()
    .from(RedirectWebCardTable)
    .where(eq(RedirectWebCardTable.fromUserName, userName));
};

/**
 * deletes a redirection by username
 *
 * @param fromUserName - The username of the redirection to delete
 */
export const deleteRedirection = async (fromUserName: string) => {
  await db()
    .delete(RedirectWebCardTable)
    .where(eq(RedirectWebCardTable.fromUserName, fromUserName));
};

/**
 * deletes a redirection by from and to username
 *
 * @param fromUserName - The username of the redirection to delete
 * @param toUserName - The username of the redirection to delete
 */
export const deleteRedirectionFromTo = async (
  fromUserName: string,
  toUserName: string,
) => {
  await db()
    .delete(RedirectWebCardTable)
    .where(
      and(
        eq(RedirectWebCardTable.fromUserName, fromUserName),
        eq(RedirectWebCardTable.toUserName, toUserName),
      ),
    );
};
