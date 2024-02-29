import { eq, and } from 'drizzle-orm';
import { primaryKey, mysqlTable } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const FollowTable = mysqlTable(
  'Follow',
  {
    followerId: cols.cuid('followerId').notNull(),
    followingId: cols.cuid('followingId').notNull(),
    createdAt: cols.dateTime('createdAt').notNull(),
  },
  table => {
    return {
      followFollowerIdFollowingId: primaryKey({
        columns: [table.followerId, table.followingId],
      }),
    };
  },
);

export type Follow = InferSelectModel<typeof FollowTable>;
export type NewFollow = InferInsertModel<typeof FollowTable>;

/**
 * Checks if a webCard is following another one.
 *
 * @param webCardId - The id of the potential follower
 * @param targetId - The id of the potential followed webCard
 * @returns true if the webCard is following the target, false otherwise
 */
export const isFollowing = async (
  webCardId: string,
  targetId: string,
  trx: DbTransaction = db,
) =>
  trx
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
 * Adds a follow relation between two webCard.
 *
 * @param webCardId - The id of the follower
 * @param targetId - The id of the followed webCard
 */
export const follows = async (
  webCardId: string,
  targetId: string,
  trx: DbTransaction = db,
) =>
  trx
    .insert(FollowTable)
    .values({
      followerId: webCardId,
      followingId: targetId,
    })

    .then(() => void 0);

/**
 * Removes a follow relation between two webCards.
 *
 * @param webCardId - The id of the follower
 * @param targetId - The id of the followed webCard
 */
export const unfollows = (
  webCardId: string,
  targetId: string,
  trx: DbTransaction = db,
) =>
  trx
    .delete(FollowTable)
    .where(
      and(
        eq(FollowTable.followerId, webCardId),
        eq(FollowTable.followingId, targetId),
      ),
    )

    .then(() => void 0);
/**
 *
 *
 * @param {string} followerId
 * @param {string} followingId
 * @param {DbTransaction} [trx=db]
 */
export const getFollows = (
  followerId: string,
  followingId: string,
  trx: DbTransaction = db,
) =>
  trx
    .select()
    .from(FollowTable)
    .where(
      and(
        eq(FollowTable.followerId, followerId),
        eq(FollowTable.followingId, followingId),
      ),
    );
