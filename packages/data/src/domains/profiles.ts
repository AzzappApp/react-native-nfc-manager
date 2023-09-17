import { createId } from '@paralleldrive/cuid2';
import { eq, asc, sql, and, lt, desc, isNull, ne } from 'drizzle-orm';
import {
  mysqlEnum,
  index,
  uniqueIndex,
  fulltextIndex,
  mysqlTable,
  json,
  boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
  int,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import { FollowTable } from './follows';
import { getUserById } from './users';
import type { Profile } from '#schema/ProfileResolvers';
import type { DbTransaction } from './db';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { InferModel } from 'drizzle-orm';

export const ProfileTable = mysqlTable(
  'Profile',
  {
    /* Profile infos */
    id: cols.cuid('id').primaryKey().notNull(),
    userId: cols.cuid('userId').notNull(),
    userName: cols.defaultVarchar('userName').notNull(),
    profileKind: mysqlEnum('profileKind', ['personal', 'business']).notNull(),
    profileCategoryId: cols.cuid('profileCategoryId'),
    firstName: cols.defaultVarchar('firstName'),
    lastName: cols.defaultVarchar('lastName'),
    companyName: cols.defaultVarchar('companyName'),
    companyActivityId: cols.cuid('companyActivityId'),
    createdAt: cols.dateTime('createdAt', true).notNull(),
    updatedAt: cols.dateTime('updatedAt', true).notNull(),

    /* Cards infos */
    cardColors: json('cardColors').$type<{
      primary: string;
      light: string;
      dark: string;
      otherColors: string[];
    } | null>(),
    cardStyle: json('cardStyle').$type<CardStyle>(),
    cardIsPrivate: boolean('cardIsPrivate').default(false).notNull(),
    cardIsPublished: boolean('cardIsPublished').default(false).notNull(),
    lastCardUpdate: cols.dateTime('lastCardUpdate', true).notNull(),

    /* Covers infos */
    coverTitle: cols.defaultVarchar('coverTitle'),
    coverSubTitle: cols.defaultVarchar('coverSubTitle'),
    coverData: json('coverData').$type<{
      titleStyle: TextStyle;
      subTitleStyle: TextStyle;
      textOrientation: TextOrientation;
      textPosition: TextPosition;
      backgroundId?: string | null;
      backgroundColor?: string | null;
      backgroundPatternColor?: string | null;
      foregroundId?: string | null;
      foregroundColor?: string | null;
      sourceMediaId: string | null;
      maskMediaId?: string | null;
      mediaFilter?: string | null;
      mediaParameters?: Record<string, any> | null;
      mediaId?: string | null;
      merged: boolean;
      segmented: boolean;
    }>(),

    /* Contact cards infos */
    contactCard: json('contactCard').$type<ContactCard>(),
    contactCardIsPrivate: boolean('contactCardIsPrivate')
      .default(true)
      .notNull(),
    contactCardDisplayedOnWebCard: boolean('contactCardDisplayedOnWebCard')
      .default(false)
      .notNull(),
    lastContactCardUpdate: cols
      .dateTime('lastContactCardUpdate', true)
      .notNull(),

    nbFollowers: int('nbFollowers').default(0).notNull(),
    nbFollowings: int('nbFollowings').default(0).notNull(),
    nbPosts: int('nbPosts').default(0).notNull(),
    nbLikes: int('nbLikes').default(0).notNull(),
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
 * Retrieves a profile by its id
 * @param id - The id of the profile to retrieve
 * @returns The profile if found, otherwise null
 */
export const getProfileById = async (id: string) =>
  db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.id, id))
    .then(res => res[0] ?? null);

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
 * Retrieve the list of profile a profile is following
 * @param profileId - The id of the profile
 * @param params - The parameters to filter the result
 * @returns A list of profile
 */
export const getFollowings = async (
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

export const getRecommendedProfiles = async (
  profileId: string,
  userId: string,
) => {
  const result = await db
    .select({ Profile: ProfileTable })
    .from(ProfileTable)
    .leftJoin(
      FollowTable,
      and(
        eq(FollowTable.followingId, ProfileTable.id),
        eq(FollowTable.followerId, profileId),
      ),
    )
    .where(
      and(
        ne(ProfileTable.userId, userId),
        isNull(FollowTable.followerId),
        eq(ProfileTable.cardIsPublished, true),
      ),
    );

  return result.map(({ Profile }) => Profile);
};

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
 * Retrieve the list of profile a profile is following
 * @param profileId - The id of the profile
 * @returns the list of profile a profileis following
 */
export const getFollowingsProfiles = async (
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
    .innerJoin(FollowTable, eq(FollowTable.followingId, ProfileTable.id))
    .where(
      and(
        eq(FollowTable.followerId, profileId),
        after ? lt(FollowTable.createdAt, after) : undefined,
        userName
          ? sql`MATCH (${ProfileTable.userName}) AGAINST ("${userName}*" IN BOOLEAN MODE)`
          : undefined,
      ),
    )
    .orderBy(desc(FollowTable.createdAt))
    .limit(limit);

/**
 * Create a new profile
 * @param data - The profile fields, excluding the id
 * @returns The newly created profile
 */
export const createProfile = async (data: NewProfile): Promise<string> => {
  const profileId = createId();
  await db.insert(ProfileTable).values({
    id: profileId,
    ...data,
  });
  return profileId;
};

export const updateProfile = async (
  profileId: string,
  updates: Partial<Profile>,
  tx: DbTransaction = db,
) => {
  const updatedProfile = {
    updatedAt: new Date(),
    ...updates,
  };

  await tx
    .update(ProfileTable)
    .set(updatedProfile)
    .where(eq(ProfileTable.id, profileId));
};

/**
 * Build a default contact card from a profile and a user
 * @param profile
 * @returns
 */
export const buildDefaultContactCard = async (
  profile: NewProfile,
): Promise<ContactCard> => {
  const user = await getUserById(profile.userId);
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    company: profile.companyName,
    title: null,
    emails: user?.email
      ? [
          {
            address: user.email,
            label: 'Home',
            selected: true,
          },
        ]
      : null,
    phoneNumbers: user?.phoneNumber
      ? [
          {
            number: user.phoneNumber,
            label: 'Home',
            selected: true,
          },
        ]
      : null,
  };
};
