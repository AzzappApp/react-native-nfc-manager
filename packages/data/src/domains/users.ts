import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { uniqueIndex, mysqlTable, json, boolean } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const UserTable = mysqlTable(
  'User',
  {
    id: cols.cuid('id').primaryKey().$defaultFn(createId),
    email: cols.defaultVarchar('email'),
    password: cols.defaultVarchar('password'),
    phoneNumber: cols.defaultVarchar('phoneNumber'),
    createdAt: cols.dateTime('createdAt').notNull(),
    updatedAt: cols.dateTime('updatedAt').notNull(),
    roles: json('roles').$type<string[]>(),
    invited: boolean('invited').default(false).notNull(),
    locale: cols.defaultVarchar('locale'),
    emailConfirmed: boolean('emailConfirmed').default(false).notNull(),
    phoneNumberConfirmed: boolean('phoneNumberConfirmed')
      .default(false)
      .notNull(),
  },
  table => {
    return {
      emailKey: uniqueIndex('User_email_key').on(table.email),
      phoneNumberKey: uniqueIndex('User_phoneNumber_key').on(table.phoneNumber),
    };
  },
);
export type User = InferSelectModel<typeof UserTable>;
export type NewUser = InferInsertModel<typeof UserTable>;

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
export const createUser = async (data: NewUser, tx: DbTransaction = db) => {
  const id = createId();
  await tx.insert(UserTable).values({ ...data, id });
  return id;
};

export const createUsers = async (data: NewUser[], tx: DbTransaction = db) => {
  await tx.insert(UserTable).ignore().values(data);
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
