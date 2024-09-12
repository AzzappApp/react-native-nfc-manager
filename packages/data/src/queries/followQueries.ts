import { eq, and, sql } from 'drizzle-orm';
import { db, transaction } from '../database';
import { FollowTable, WebCardTable } from '../schema';

/**
 * Checks if a web card is following another one.
 *
 * @param webCardId - The id of the potential follower
 * @param targetId - The id of the potential followed web card
 * @returns true if the webCard is following the target, false otherwise
 */
export const isFollowing = async (webCardId: string, targetId: string) =>
  db()
    .select()
    .from(FollowTable)
    .where(
      and(
        eq(FollowTable.followerId, webCardId),
        eq(FollowTable.followingId, targetId),
      ),
    )
    .then(res => Boolean(res.pop()));

/**
 * Adds a follow relation between two web card.
 *
 * @param webCardId - The id of the follower
 * @param targetId - The id of the followed web card
 */
export const follows = async (webCardId: string, targetId: string) => {
  await transaction(async () => {
    if (await isFollowing(webCardId, targetId)) {
      return;
    }
    await db()
      .update(WebCardTable)
      .set({
        nbFollowers: sql`nbFollowers + 1`,
      })
      .where(eq(WebCardTable.id, targetId));

    await db()
      .update(WebCardTable)
      .set({
        nbFollowings: sql`nbFollowings + 1`,
      })
      .where(eq(WebCardTable.id, webCardId));

    await db().insert(FollowTable).values({
      followerId: webCardId,
      followingId: targetId,
    });
  });
};

/**
 * Removes a follow relation between two web card.
 *
 * @param webCardId - The id of the follower
 * @param targetId - The id of the followed web card
 */
export const unfollows = async (webCardId: string, targetId: string) => {
  await transaction(async () => {
    if (!(await isFollowing(webCardId, targetId))) {
      return;
    }
    await db()
      .update(WebCardTable)
      .set({
        nbFollowers: sql`nbFollowers - 1`,
      })
      .where(eq(WebCardTable.id, targetId));

    await db()
      .update(WebCardTable)
      .set({
        nbFollowings: sql`nbFollowings - 1`,
      })
      .where(eq(WebCardTable.id, webCardId));

    await db()
      .delete(FollowTable)
      .where(
        and(
          eq(FollowTable.followerId, webCardId),
          eq(FollowTable.followingId, targetId),
        ),
      );
  });
};
