import { createId } from '@paralleldrive/cuid2';
import { eq, inArray } from 'drizzle-orm';
import { datetime, json, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import ERRORS from '@azzapp/shared/errors';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
  mysqlTable,
} from './db';
import type { InferModel } from 'drizzle-orm';

export const UserTable = mysqlTable(
  'User',
  {
    id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    email: varchar('email', { length: DEFAULT_VARCHAR_LENGTH }),
    password: varchar('password', { length: DEFAULT_VARCHAR_LENGTH }),
    phoneNumber: varchar('phoneNumber', { length: DEFAULT_VARCHAR_LENGTH }),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
    updatedAt: datetime('updatedAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
    roles: json('roles'),
  },
  table => {
    return {
      emailKey: uniqueIndex('User_email_key').on(table.email),
      phoneNumberKey: uniqueIndex('User_phoneNumber_key').on(table.phoneNumber),
    };
  },
);
export type User = InferModel<typeof UserTable>;
export type NewUser = Omit<InferModel<typeof UserTable, 'insert'>, 'id'>;

/**
 * Retrieve a list of user by their ids
 * @param ids - The ids of the user to retrieve
 * @returns A list of user, where the order of the user matches the order of the ids
 */
export const getUsersByIds = (ids: string[]): Promise<User[]> =>
  db.select().from(UserTable).where(inArray(UserTable.id, ids));

/**
 * Retrieve a user by their email
 * @param email - The email of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email))

    .then(user => user.pop() ?? null);
};

/**
 * Retrieve a user by their phoneNumber
 * @param phoneNumber - The phoneNumber of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByPhoneNumber = async (
  phoneNumber: string,
): Promise<User | null> => {
  return db
    .select()
    .from(UserTable)
    .where(eq(UserTable.phoneNumber, phoneNumber))

    .then(user => user.pop() ?? null);
};

/**
 * Create a new user
 * @param data - The user fields, excluding the id
 * @returns The newly created user
 */
export const createUser = async (data: NewUser): Promise<User> => {
  const addedUser = {
    id: createId(),
    ...data,
  };
  await db.insert(UserTable).values(addedUser);

  return {
    ...addedUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    email: addedUser.email ?? null,
    phoneNumber: addedUser.phoneNumber ?? null,
    password: addedUser.password ?? null,
    roles: UserTable.roles ?? null,
  };
};

export const updateUser = async (
  userId: string,
  data: Partial<User>,
): Promise<Partial<User>> => {
  const updatedUser = {
    updatedAt: new Date(),
    ...data,
  };
  const result = await db
    .update(UserTable)
    .set(updatedUser)
    .where(eq(UserTable.id, userId));
  if (result.rowsAffected > 0) {
    return updatedUser;
  } else {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
};
