import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import {
  uniqueIndex,
  mysqlTable,
  json,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { InferModel } from 'drizzle-orm';

export const UserTable = mysqlTable(
  'User',
  {
    id: cols.cuid('id').primaryKey(),
    email: cols.defaultVarchar('email'),
    password: cols.defaultVarchar('password'),
    phoneNumber: cols.defaultVarchar('phoneNumber'),
    createdAt: cols.dateTime('createdAt', true).notNull(),
    updatedAt: cols.dateTime('updatedAt', true).notNull(),
    roles: json('roles').$type<string[]>(),
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
export const getUserById = (id: string): Promise<User | null> =>
  db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, id))
    .then(user => user[0]);

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
    roles: addedUser.roles ?? null,
  };
};

export const updateUser = async (
  userId: string,
  data: Partial<User>,
): Promise<void> => {
  const updatedUser = {
    updatedAt: new Date(),
    ...data,
  };
  await db.update(UserTable).set(updatedUser).where(eq(UserTable.id, userId));
};
