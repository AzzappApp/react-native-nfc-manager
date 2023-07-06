import { eq, and } from 'drizzle-orm';
import {
  index,
  primaryKey,
  datetime,
  varchar,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';
import type { InferModel } from 'drizzle-orm';

export const FollowTable = mysqlTable(
  'Follow',
  {
    followerId: varchar('followerId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }).notNull(),
    followingId: varchar('followingId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }).notNull(),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
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
export const follows = async (userId: string, targetId: string) =>
  db
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
export const unfollows = (userId: string, targetId: string) =>
  db
    .delete(FollowTable)
    .where(
      and(
        eq(FollowTable.followerId, userId),
        eq(FollowTable.followingId, targetId),
      ),
    )

    .then(() => void 0);
