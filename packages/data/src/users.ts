import { eq, and, inArray, sql } from 'drizzle-orm';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { createId } from './helpers/createId';
import { ProfileTable } from './profiles';
import { WebCardTable } from './webCards';
import type { DbTransaction } from './db';
import type {
  InferInsertModel,
  InferSelectModel,
  SQLWrapper,
} from 'drizzle-orm';

export const UserTable = cols.table(
  'User',
  {
    id: cols.cuid('id').primaryKey().$defaultFn(createId),
    email: cols.defaultVarchar('email'),
    password: cols.defaultVarchar('password'),
    phoneNumber: cols.defaultVarchar('phoneNumber'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    roles: cols.json('roles').$type<string[]>(),
    invited: cols.boolean('invited').default(false).notNull(),
    locale: cols.defaultVarchar('locale'),
    emailConfirmed: cols.boolean('emailConfirmed').default(false).notNull(),
    phoneNumberConfirmed: cols
      .boolean('phoneNumberConfirmed')
      .default(false)
      .notNull(),
    deleted: cols.boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
    note: cols.text('note'),
  },
  table => {
    return {
      emailKey: cols.uniqueIndex('User_email_key').on(table.email),
      phoneNumberKey: cols
        .uniqueIndex('User_phoneNumber_key')
        .on(table.phoneNumber),
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
export const createUser = async (data: NewUser, tx = db.client()) => {
  const id = data.id ?? createId();
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
  await db.update(UserTable).set(data).where(eq(UserTable.id, userId));
};

export const getTotalMultiUser = async (userId: string) => {
  const webCardIds = await db
    .select()
    .from(ProfileTable)
    .leftJoin(WebCardTable, eq(ProfileTable.webCardId, WebCardTable.id))
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.profileRole, 'owner'),
        eq(WebCardTable.isMultiUser, true),
      ),
    );

  // Extract the webCardIds from the result
  const webCardIdList = webCardIds.map(profile => profile.Profile.webCardId);

  if (webCardIdList.length === 0) return 0;
  // Count the number of profiles associated with the webCardIds
  return db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .where(inArray(ProfileTable.webCardId, webCardIdList))
    .then(res => res[0].count);
};

export const getUserByEmailPhoneNumber = (
  email?: string,
  phoneNumber?: string,
) => {
  const filters: SQLWrapper[] = [];

  if (email) filters.push(eq(UserTable.email, email));
  if (phoneNumber) filters.push(eq(UserTable.phoneNumber, phoneNumber));

  return db
    .client()
    .select()
    .from(UserTable)
    .where(and(...filters))
    .then(results => results.pop() ?? null);
};
