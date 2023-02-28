import db from './db';

/**
 * Checks if a profile is following another one.
 *
 * @param userId - The id of the potential follower
 * @param targetId - The id of the potential followed user
 * @returns true if the user is following the target, false otherwise
 */
export const isFollowing = async (
  userId: string,
  targetId: string,
): Promise<boolean> =>
  db
    .selectFrom('Follow')
    .selectAll()
    .where('followerId', '=', userId)
    .where('followingId', '=', targetId)
    .executeTakeFirst()
    .then(follow => !!follow);

/**
 * Adds a follow relation between two users.
 *
 * @param userId - The id of the follower
 * @param targetId - The id of the followed user
 */
export const follows = async (
  userId: string,
  targetId: string,
): Promise<void> =>
  db
    .insertInto('Follow')
    .values({
      followerId: userId,
      followingId: targetId,
    })
    .execute()
    .then(() => void 0);

/**
 * Removes a follow relation between two users.
 *
 * @param userId - The id of the follower
 * @param targetId - The id of the followed user
 */
export const unfollows = (userId: string, targetId: string): Promise<void> =>
  db
    .deleteFrom('Follow')
    .where('followerId', '=', userId)
    .where('followingId', '=', targetId)
    .execute()
    .then(() => void 0);
