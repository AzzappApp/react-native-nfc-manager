import * as uuid from 'uuid';
import db from './db';
import { getEntitiesByIds } from './generic';
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
 * Retrieve a user by their phoneNumber
 * @param phoneNumber - The phoneNumber of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByPhoneNumber = async (
  phoneNumber: string,
): Promise<User | null> => {
  const user = await db
    .selectFrom('User')
    .selectAll()
    .where('phoneNumber', '=', phoneNumber)
    .executeTakeFirst();
  return user ?? null;
};

/**
 * Create a new user
 * @param data - The users fields, excluding the id
 * @returns The newly created user
 */
export const createUser = async (
  data: Omit<User, 'createdAt' | 'id' | 'updatedAt'>,
): Promise<User> => {
  const user = {
    id: uuid.v4(),
    updatedAt: new Date(),
    ...data,
  };
  await db.insertInto('User').values(user).execute();
  return { ...user, createdAt: new Date() };
};
