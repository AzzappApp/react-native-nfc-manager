import { sql } from 'kysely';
import * as uuid from 'uuid';
import db from './db';
import { getEntitiesByIds, sqlCountToNumber } from './generic';
import type { User } from '@prisma/client';

/**
 * Retrieve a list of users by their ids
 * @param ids - The ids of the users to retrieve
 * @returns A list of users, where the order of the users matches the order of the ids
 */
export const getUsersByIds = (
  ids: readonly string[],
): Promise<Array<User | null>> => getEntitiesByIds('User', ids);

/**
 * Retrieve a user by their username
 *
 * @param userName - The username of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByUserName = async (
  userName: string,
): Promise<User | null> => {
  const user = await db
    .selectFrom('User')
    .selectAll()
    .where('userName', '=', userName)
    .executeTakeFirst();
  return user ?? null;
};

/**
 * Retrieve a user by their email
 * @param email - The email of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await db
    .selectFrom('User')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  return user ?? null;
};

/**
 * Retrieve all users with a card
 * @param limit - The maximum number of users to retrieve
 * @param offset - The number of users to skip
 * @returns A list of users
 */
export const getAllUsersWithCard = async (
  limit: number,
  offset: number,
): Promise<User[]> =>
  db
    .selectFrom('User')
    .selectAll()
    .whereExists(sql`(select Card.id from Card where User.id = Card.userId)`)
    .limit(limit)
    .offset(offset)
    .execute();

/**
 * Retrieve the number of users with a card
 *
 * @returns The number of users with a card
 */
export const getAllUsersWithCardCount = async (): Promise<number> =>
  db
    .selectFrom('User')
    .select(db.fn.count('id').as('nbUsers'))
    .whereExists(sql`(select Card.id from Card where User.id = Card.userId)`)
    .executeTakeFirstOrThrow()
    .then(({ nbUsers }) => sqlCountToNumber(nbUsers));

/**
 * Retrieve the list of users a user is following
 * @param userId - The id of the user
 * @returns A list of users
 */
export const getFollowedUsers = async (userId: string): Promise<User[]> =>
  db
    .selectFrom('User')
    .selectAll()
    .innerJoin('Follow', 'User.id', 'Follow.followingId')
    .whereExists(sql`(select Card.id from Card where User.id = Card.userId)`)
    .where('Follow.followerId', '=', userId)
    .execute();

/**
 * Create a new user
 * @param data - The users fields, excluding the id
 * @returns The newly created user
 */
export const createUser = async (data: Omit<User, 'id'>): Promise<User> => {
  const user = { id: uuid.v4(), ...data };
  await db.insertInto('User').values(user).execute();
  return user;
};
