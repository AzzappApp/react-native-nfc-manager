import {
  eq,
  and,
  inArray,
  sql,
  count,
  or,
  isNull,
  like,
  asc,
  desc,
  exists,
  notInArray,
  notExists,
  ne,
} from 'drizzle-orm';
import { db, transaction } from '../database';
import { UserTable, ProfileTable, PostTable, WebCardTable } from '../schema';
import { getProfilesByUser } from './profileQueries';
import type { Profile, User } from '../schema';
import type { InferInsertModel, SQLWrapper } from 'drizzle-orm';

/**
 * Retrieve an user by its id
 *
 * @param id - the id of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserById = (id: string): Promise<User | null> =>
  db()
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, id))
    .then(res => res[0] ?? null);

/**
 * Retrieve a user by his email
 *
 * @param email - The email of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByEmail = (email: string): Promise<User | null> =>
  db()
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email))
    .then(res => res[0] ?? null);

/**
 * Retrieve a list of users by their emails
 *
 * @param email - The email of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUsersByEmail = async (
  emails: string[],
): Promise<Array<User | null>> => {
  const users = await db()
    .select()
    .from(UserTable)
    .where(inArray(UserTable.email, emails));

  const usersMap = users.reduce(
    (acc, user) => {
      if (user.email) {
        acc[user.email] = user;
      }
      return acc;
    },
    {} as Record<string, User>,
  );

  return emails.map(email => usersMap[email] ?? null);
};

/**
 * Retrieve a user by his phoneNumber
 *
 * @param phoneNumber - The phoneNumber of the user to retrieve
 * @returns The user if found, otherwise null
 */
export const getUserByPhoneNumber = (
  phoneNumber: string,
): Promise<User | null> =>
  db()
    .select()
    .from(UserTable)
    .where(eq(UserTable.phoneNumber, phoneNumber))
    .then(res => res[0] ?? null);

/**
 * Create a new user
 *
 * @param newUser - The user fields
 * @returns The newly created user id
 */
export const createUser = (newUser: InferInsertModel<typeof UserTable>) =>
  db()
    .insert(UserTable)
    .values(newUser)
    .$returningId()
    .then(res => res[0].id);

/**
 * Create multiple users
 *
 * @param newUsers - the users data
 * @returns The newly created users ids
 */
export const createUsers = (
  newUsers: Array<InferInsertModel<typeof UserTable>>,
) =>
  db()
    .insert(UserTable)
    .ignore()
    .values(newUsers)
    .$returningId()
    .then(res => res.map(({ id }) => id));

/**
 * Update an user
 *
 * @param userId - the id of the user to update
 * @param updates - the updates to apply to the user
 */
export const updateUser = async (
  userId: string,
  updates: Partial<Omit<User, 'id'>>,
): Promise<void> => {
  await db().update(UserTable).set(updates).where(eq(UserTable.id, userId));
};

/**
 * Mark an user as active
 *
 * @param userId - the id of the user to active
 */
export const markUserAsActive = (userId: string) =>
  transaction(async () => {
    await updateUser(userId, {
      deletedAt: undefined,
      deletedBy: undefined,
      deleted: false,
    });
  });

/**
 * Mark an user as deleted, and update all the related profiles/webcards
 *
 * @param userId - the id of the user to delete
 * @param deletedBy - the id of the user who deleted the user
 */
export const markUserAsDeleted = async (
  userId: string,
  deletedBy: string,
): Promise<void> =>
  transaction(async () => {
    const updates = {
      deletedAt: new Date(),
      deletedBy,
      deleted: true,
    };
    await updateUser(userId, updates);
    const userProfiles = (await getProfilesByUser(userId)).filter(
      profile => profile.deleted === false,
    );
    await db()
      .update(ProfileTable)
      .set(updates)
      .where(
        inArray(
          ProfileTable.id,
          userProfiles.map(profile => profile.id),
        ),
      );

    const ownerProfiles: Profile[] = [];
    userProfiles.forEach(profile => {
      if (profile.profileRole === 'owner') {
        ownerProfiles.push(profile);
      }
    }, []);

    if (ownerProfiles.length > 0) {
      const ownedWebCardIds = ownerProfiles.map(profile => profile.webCardId);
      await db()
        .update(WebCardTable)
        .set({
          ...updates,
          cardIsPublished: false,
        })
        .where(inArray(WebCardTable.id, ownedWebCardIds));

      await db()
        .update(PostTable)
        .set(updates)
        .where(
          and(
            inArray(PostTable.webCardId, ownedWebCardIds),
            eq(PostTable.deleted, false),
          ),
        );

      await db()
        .update(WebCardTable)
        .set({
          nbPostsLiked: sql`GREATEST(nbPostsLiked - 1, 0)`,
        })
        .where(
          inArray(
            WebCardTable.id,
            sql`(select r.webCardId from PostReaction r inner join Post p on p.id = r.postId where p.webCardId in ${ownedWebCardIds})`,
          ),
        );

      await db()
        .update(WebCardTable)
        .set({
          nbFollowers: sql`GREATEST(nbFollowers - 1, 0)`,
        })
        .where(
          inArray(
            WebCardTable.id,
            sql`(select followingId from Follow where followerId in ${ownedWebCardIds})`,
          ),
        );

      await db()
        .update(WebCardTable)
        .set({
          nbFollowings: sql`GREATEST(nbFollowings - 1, 0)`,
        })
        .where(
          inArray(
            WebCardTable.id,
            sql`(select followerId from Follow where followingId in ${ownedWebCardIds})`,
          ),
        );
    }
  });

export const getTotalMultiUser = async (userId: string) => {
  const webCardIds = await db()
    .select()
    .from(ProfileTable)
    .leftJoin(WebCardTable, eq(ProfileTable.webCardId, WebCardTable.id))
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.profileRole, 'owner'),
        eq(WebCardTable.isMultiUser, true),
        eq(WebCardTable.cardIsPublished, true),
      ),
    );

  // Extract the webCardIds from the result
  const webCardIdList = webCardIds.map(profile => profile.Profile.webCardId);

  if (webCardIdList.length === 0) return 0;
  // Count the number of profiles associated with the webCardIds
  return db()
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .where(
      and(
        inArray(ProfileTable.webCardId, webCardIdList),
        ne(ProfileTable.deleted, true),
      ),
    )
    .then(res => res[0].count);
};

export const getUserByEmailPhoneNumber = (
  email?: string,
  phoneNumber?: string,
) => {
  const filters: SQLWrapper[] = [];

  if (email) filters.push(eq(UserTable.email, email));
  if (phoneNumber) filters.push(eq(UserTable.phoneNumber, phoneNumber));

  return db()
    .select()
    .from(UserTable)
    .where(and(...filters))
    .then(results => results.pop() ?? null);
};

/**
 * Retrieves the list of owners for a list of web cards
 *
 * @param webCardIds - The list of web card ids
 * @returns
 *  An array corresponding to the ids provided with for each index
 *  the corresponding user owning the web card or null if not found (generally impossible)
 */
export const getWebCardsOwnerUsers = async (
  webCardIds: readonly string[],
): Promise<Array<User | null>> => {
  const profiles = await db()
    .select({
      user: UserTable,
      webCardId: ProfileTable.webCardId,
    })
    .from(ProfileTable)
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .where(
      and(
        inArray(ProfileTable.webCardId, webCardIds as string[]),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    );
  const usersMap = profiles.reduce(
    (acc, { user, webCardId }) => {
      acc[webCardId] = user;
      return acc;
    },
    {} as Record<string, User>,
  );

  return webCardIds.map(webCardId => usersMap[webCardId] ?? null);
};

/**
 * Retrieves the list of users associated with a web card alongside their profile id
 *
 * @param webCardId - The web card id
 * @param profileIds - The list of profile ids to filter on,
 *  if not provided all web card users are returned
 * @returns The list of users associated with the web card
 */
export const getUsersFromWebCard = async (
  webCardId: string,
  profileIds?: string[],
) =>
  db()
    .select({
      profileId: ProfileTable.id,
      profileIsDeleted: ProfileTable.deleted,
      user: UserTable,
    })
    .from(ProfileTable)
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .where(
      profileIds
        ? and(
            eq(ProfileTable.webCardId, webCardId),
            inArray(ProfileTable.id, profileIds),
          )
        : eq(ProfileTable.webCardId, webCardId),
    );

export const deleteUnusedAccounts = async (
  profileIdsToDelete: string[],
): Promise<void> => {
  await db()
    .delete(UserTable)
    .where(
      and(
        exists(
          db()
            .select({ userId: ProfileTable.userId })
            .from(ProfileTable)
            .where(
              and(
                eq(ProfileTable.userId, UserTable.id),
                inArray(ProfileTable.id, profileIdsToDelete),
              ),
            ),
        ),
        notExists(
          db()
            .select({ userId: ProfileTable.userId })
            .from(ProfileTable)
            .where(
              and(
                eq(ProfileTable.userId, UserTable.id),
                notInArray(ProfileTable.id, profileIdsToDelete),
              ),
            ),
        ),
        eq(UserTable.invited, true),
      ),
    );

  await db()
    .delete(ProfileTable)
    .where(
      and(
        inArray(ProfileTable.id, profileIdsToDelete),
        notExists(
          db()
            .select()
            .from(UserTable)
            .where(eq(UserTable.id, ProfileTable.userId)), // No corresponding user
        ),
      ),
    );
};

/**
 * Retrieves the list of users in the database matching the provided filters
 *
 * @param args - The filters to apply to the query
 * @param args.offset - The offset to start from
 * @param args.limit - The maximum number of users to retrieve
 * @param args.sortField - The field to sort the users by
 * @param args.sortOrder - The order to sort the users by
 * @param args.search - A search string to filter the users by
 * @param args.enabled - Whether to filter the users by their enabled status
 *
 * @returns The list of users matching the provided filters and the total number of users in the database matching the filters
 */
export const getUsersInfos = async ({
  offset,
  limit,
  sortField = 'createdAt',
  sortOrder = 'desc',
  search = null,
  enabled = null,
}: {
  offset: number;
  limit: number;
  sortField?:
    | 'createdAt'
    | 'email'
    | 'phoneNumber'
    | 'status'
    | 'webCardsCount';
  sortOrder?: 'asc' | 'desc';
  search?: string | null;
  enabled?: boolean | null;
}) => {
  const sortFunc = sortOrder === 'asc' ? asc : desc;
  let query = db()
    .select({
      id: UserTable.id,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      webCardsCount: sql`count(webCardId) as webCardsCount`.mapWith(Number),
      createdAt: UserTable.createdAt,
      status: UserTable.deleted,
    })
    .from(UserTable)
    .leftJoin(ProfileTable, eq(UserTable.id, ProfileTable.userId))
    .leftJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .orderBy(sortFunc(sql.raw(sortField)))
    .groupBy(UserTable.id)
    .$dynamic();

  const filters = [];

  if (enabled != null) {
    filters.push(
      enabled
        ? or(isNull(UserTable.deleted), eq(UserTable.deleted, false))
        : eq(UserTable.deleted, true),
    );
  }

  if (search) {
    filters.push(
      or(
        like(UserTable.email, `%${search}%`),
        like(UserTable.phoneNumber, `%${search.trim()}%`),
        like(UserTable.id, `%${search}%`),
        like(WebCardTable.userName, `%${search}%`),
        like(WebCardTable.companyName, `%${search}%`),
      ),
    );
  }

  query = query.where(and(...filters));
  const countQuery = db().select({ count: count() }).from(query.as('SubQuery'));

  const [users, nbUsers] = await Promise.all([
    query.offset(offset).limit(limit),
    countQuery.then(rows => rows[0].count),
  ]);

  return { users, count: nbUsers };
};
