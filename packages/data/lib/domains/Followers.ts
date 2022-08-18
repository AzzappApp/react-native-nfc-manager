import { createObjectMapper, uuidMapping } from '../helpers/databaseUtils';
import { getClient } from './db';

export type Followers = {
  followerId: string;
  followingId: string;
  followDate: Date;
};

const followerSymbol = Symbol('Post');

export const followerMapper = createObjectMapper<Followers>(
  {
    followerId: uuidMapping,
    followingId: uuidMapping,
  },
  followerSymbol,
);

export const isFollower = (val: any): val is Followers => {
  return val != null && val[followerSymbol] === true;
};

export const isFollowing = (
  followerId: string,
  followingId: string,
): Promise<boolean | null> =>
  getClient()
    .execute('SELECT * FROM followers WHERE follower_id=? AND following_id=?', [
      followerId,
      followingId,
    ])
    .then(result => {
      return result.rows.length > 0;
    });

export const follow = async (followerId: string, followingId: string) =>
  getClient().execute(
    'INSERT INTO followers (follower_id, following_id, follow_date) VALUES(?,?, ?)',
    [followerId, followingId, new Date()],
  );

export const unFollow = async (followerId: string, followingId: string) =>
  getClient().execute(
    'DELETE FROM followers WHERE follower_id=? AND following_id=?',
    [followerId, followingId],
  );

export const getUserFollowingIds = async (userId: string): Promise<string[]> =>
  getClient()
    .execute('SELECT * FROM followers WHERE follower_id=? ', [userId])
    .then(result =>
      result.rows
        .map(followerMapper.parse)
        .sort((a, b) => b.followDate.getTime() - a.followDate.getTime())
        .map(({ followingId }) => followingId?.toString()),
    );

export const getUserFollowersIds = async (
  followerId: string,
): Promise<string[]> =>
  getClient()
    .execute('SELECT * FROM followers WHERE following_id=? ', [followerId])
    .then(result =>
      result.rows
        .map(followerMapper.parse)
        .sort((a, b) => b.followDate.getTime() - a.followDate.getTime())
        .map(({ followerId }) => followerId?.toString()),
    );
