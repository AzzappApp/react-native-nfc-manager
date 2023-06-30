import { createId } from '@paralleldrive/cuid2';
import {
  eq,
  asc,
  inArray,
  exists,
  sql,
  notInArray,
  and,
  lt,
  desc,
} from 'drizzle-orm';
import {
  mysqlEnum,
  datetime,
  index,
  uniqueIndex,
  varchar,
  fulltextIndex,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import ERRORS from '@azzapp/shared/errors';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';
import { FollowTable } from './follows';
import { sortEntitiesByIds } from './generic';
import type { Profile } from '#schema/ProfileResolvers';
import type { InferModel } from 'drizzle-orm';

export const ProfileTable = mysqlTable(
  'Profile',
  {
    id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    userId: varchar('userId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    userName: varchar('userName', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    firstName: varchar('firstName', { length: DEFAULT_VARCHAR_LENGTH }),
    lastName: varchar('lastName', { length: DEFAULT_VARCHAR_LENGTH }),
    profileKind: mysqlEnum('profileKind', ['personal', 'business']).notNull(),
    companyName: varchar('companyName', { length: DEFAULT_VARCHAR_LENGTH }),
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
    colorPalette: varchar('colorPalette', { length: DEFAULT_VARCHAR_LENGTH }),
    profileCategoryId: varchar('profileCategoryId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }),
    interests: varchar('interests', { length: DEFAULT_VARCHAR_LENGTH }),
    companyActivityId: varchar('companyActivityId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }),
  },
  table => {
    return {
      userIdIdx: index('Profile_userId_idx').on(table.userId),
      userNameKey: uniqueIndex('Profile_userName_key').on(table.userName),
      profileSearch: fulltextIndex('Profile_search').on(table.userName),
    };
  },
);

export type Profile = InferModel<typeof ProfileTable>;
export type NewProfile = Omit<InferModel<typeof ProfileTable, 'insert'>, 'id'>;

/**
 * Retrieves a list of profile by their ids.
 * @param ids - The ids of the profile to retrieve
 * @returns A list of profile, where the order of the profile matches the order of the ids
 */
export const getProfilesByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(ProfileTable)
      .where(inArray(ProfileTable.id, ids as string[])),
  );

/**
 * Retrieves a list of associated to an user
 * @param id - The id of the user
 * @returns The list of profile associated to the user
 */
export const getUserProfiles = async (userId: string) => {
  const res = await db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.userId, userId))
    .orderBy(asc(ProfileTable.userName));
  return res;
};

/**
 * Retrieves a profile by their profilename
 *
 * @param profileName - The profilename of the profile to retrieve
 * @returns - The profile if found, otherwise null
 */
export const getProfileByUserName = async (profileName: string) => {
  return db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.userName, profileName))

    .then(res => res.pop() ?? null);
};

/**
 * Retrieves all profile with a card
 * @param limit - The maximum number of profile to retrieve
 * @param offset - The number of profile to skip
 * @param excludedprofileIds - The ids of the profile to exclude from the result
 * @returns A list of profile
 */
export const getAllProfilesWithCard = async (
  limit: number,
  offset: number,
  excludedprofileIds: string[] | null | undefined,
) => {
  return db
    .select()
    .from(ProfileTable)
    .where(
      and(
        exists(sql`select Card.id from Card where Profile.id = Card.profileId`),
        excludedprofileIds?.length
          ? notInArray(ProfileTable.id, excludedprofileIds)
          : undefined,
      ),
    )
    .limit(limit)
    .offset(offset);
};

/**
 * Retrieves the number of profile with a card
 *
 * @returns The number of profile with a card
 */
export const getAllProfilesWithCardCount = async () =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .where(
      exists(sql`(select Card.id from Card where Profile.id = Card.profileId)`),
    )

    .then(res => res[0].count);

/**
 * Retrieve the list of profile a profile is following
 * @param profileId - The id of the profile
 * @param params - The parameters to filter the result
 * @returns A list of profile
 */
export const getFollowedProfiles = async (
  profileId: string,
  params: { userName?: string | null },
) => {
  const result = await db
    .select({ Profile: ProfileTable })
    .from(ProfileTable)
    .innerJoin(FollowTable, eq(FollowTable.followingId, ProfileTable.id))
    .where(
      and(
        eq(FollowTable.followerId, profileId),
        params.userName
          ? sql`MATCH (${ProfileTable.userName}) AGAINST ("${params.userName}*" IN BOOLEAN MODE)`
          : undefined,
      ),
    );

  return result.map(({ Profile }) => Profile);
};

/**
 * Retrieve the number of profile a profile is following
 * @param profileId - The id of the profile
 * @returns the number of profile a profile is following
 */
export const getFollowedProfilesCount = async (profileId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .innerJoin(FollowTable, eq(FollowTable.followingId, ProfileTable.id))
    .where(eq(FollowTable.followerId, profileId))

    .then(res => res[0].count);

/**
 * Retrieve the list of profile a profile is being followed
 * @param profileId - The id of the profile
 * @param params - The parameters to filter the result
 * @returns the list of profile a profile is being followed
 */
export const getFollowerProfiles = async (
  profileId: string,
  {
    limit,
    after = null,
    userName,
  }: {
    limit: number;
    after: Date | null;
    userName?: string | null;
  },
) =>
  db
    .select({
      Profile: ProfileTable,
      followCreatedAt: FollowTable.createdAt,
    })
    .from(ProfileTable)
    .innerJoin(FollowTable, eq(FollowTable.followerId, ProfileTable.id))
    .where(
      and(
        eq(FollowTable.followingId, profileId),
        after ? lt(FollowTable.createdAt, after) : undefined,
        userName
          ? sql`MATCH (${ProfileTable.userName}) AGAINST ("${userName}*" IN BOOLEAN MODE)`
          : undefined,
      ),
    )
    .orderBy(desc(FollowTable.createdAt))
    .limit(limit);

/**
 * Retrieve the number of profile a profile is being followed
 * @param profileId - The id of the profile
 * @returns the number of profile a profile is being followed
 */
export const getFollowerProfilesCount = async (profileId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .innerJoin(FollowTable, eq(FollowTable.followerId, ProfileTable.id))
    .where(eq(FollowTable.followingId, profileId))

    .then(res => res[0].count);

/**
 * Create a new profile
 * @param data - The profile fields, excluding the id
 * @returns The newly created profile
 */
export const createProfile = async (data: NewProfile) => {
  const addedProfile = {
    ...data,
    id: createId(),
  };
  await db.insert(ProfileTable).values(addedProfile);
  return {
    ...addedProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    companyName: data.companyName ?? '',
    colorPalette: data.colorPalette ?? '',
    profileCategoryId: data.profileCategoryId ?? null,
    interests: data.interests ?? null,
    companyActivityId: data.companyActivityId ?? null,
  };
};

export const updateProfile = async (
  profileId: string,
  updates: Partial<Profile>,
) => {
  const updatedProfile = {
    updatedAt: new Date(),
    ...updates,
  };

  const result = await db
    .update(ProfileTable)
    .set(updatedProfile)
    .where(eq(ProfileTable.id, profileId));
  if (result.rowsAffected > 0) {
    return updatedProfile;
  } else {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
};
