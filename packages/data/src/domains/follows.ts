import { eq, and } from 'drizzle-orm';
import {
  index,
  primaryKey,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferModel } from 'drizzle-orm';

export const FollowTable = mysqlTable(
  'Follow',
  {
    followerId: cols.cuid('followerId').notNull(),
    followingId: cols.cuid('followingId').notNull(),
    createdAt: cols.dateTime('createdAt', true).notNull(),
  },
  table => {
    return {
      followingIdIdx: index('Follow_followingId_idx').on(table.followingId),
      followerIdIdx: index('Follow_followerId_idx').on(table.followerId),
      followFollowerIdFollowingId: primaryKey(
        table.followerId,
        table.followingId,
      ),
    };
  },
);

export type Follow = InferModel<typeof FollowTable>;
export type NewFollow = InferModel<typeof FollowTable, 'insert'>;

/**
 * Checks if a profile is following another one.
 *
 * @param userId - The id of the potential follower
 * @param targetId - The id of the potential followed user
 * @returns true if the user is following the target, false otherwise
 */
export const isFollowing = async (userId: string, targetId: string) =>
  db
    .select()
    .from(FollowTable)
    .where(
      and(
        eq(FollowTable.followerId, userId),
        eq(FollowTable.followingId, targetId),
      ),
    )

    .then(res => Boolean(res.pop()));

/**
 * Adds a follow relation between two users.
 *
 * @param userId - The id of the follower
 * @param targetId - The id of the followed user
 */
export const follows = async (
  userId: string,
  targetId: string,
  trx: DbTransaction = db,
) =>
  trx
    .insert(FollowTable)
    .values({
      followerId: userId,
      followingId: targetId,
    })

    .then(() => void 0);

/**
 * Removes a follow relation between two users.
 *
 * @param userId - The id of the follower
 * @param targetId - The id of the followed user
 */
export const unfollows = (
  userId: string,
  targetId: string,
  trx: DbTransaction = db,
) =>
  trx
    .delete(FollowTable)
    .where(
      and(
        eq(FollowTable.followerId, userId),
        eq(FollowTable.followingId, targetId),
      ),
    )

    .then(() => void 0);
