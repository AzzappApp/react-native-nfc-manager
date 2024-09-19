import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db, transaction } from '../database';
import { MediaTable, ProfileTable, WebCardTable } from '../schema';
import { getEntitiesByIds } from './entitiesQueries';
import type { Profile, WebCard } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

export type NewProfile = InferInsertModel<typeof ProfileTable>;

/**
 * Create a new profile
 *
 * @param newProfile - The profile fields
 * @returns The id of the created profile
 */
export const createProfile = async (newProfile: NewProfile) =>
  db()
    .insert(ProfileTable)
    .values(newProfile)
    .$returningId()
    .then(res => res[0].id);

/**
 * Create multiple profiles
 *
 * @param profiles - The list of profiles to create
 * @returns The list of ids of the created profiles
 */
export const createProfiles = async (profiles: NewProfile[]) =>
  db()
    .insert(ProfileTable)
    .ignore()
    .values(profiles)
    .$returningId()
    .then(res => res.map(({ id }) => id));

/**
 * Get a profile by its id
 *
 * @param profileId - The id of the profile
 * @returns The profile if found, otherwise null
 */
export const getProfileById = async (
  profileId: string,
): Promise<Profile | null> => {
  return db()
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.id, profileId))
    .then(res => res[0] ?? null);
};

export const getProfilesByIds = async (
  ids: string[],
): Promise<Array<Profile | null>> => getEntitiesByIds('Profile', ids);

/**
 * Get a profile by its id with the associated web card
 *
 * @param profileId - The id of the profile
 * @returns The profile and the associated web card if found, otherwise null
 */
export const getProfileWithWebCardById = async (
  profileId: string,
): Promise<{ profile: Profile; webCard: WebCard } | null> =>
  db()
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(eq(ProfileTable.id, profileId))
    .then(res => {
      const profile = res[0]?.Profile;
      const webCard = res[0]?.WebCard;
      return profile && webCard ? { profile, webCard } : null;
    });

/**
 * find a profile by its userId and webCardId
 *
 * @param userId - The id of the user
 * @param webCardId - The id of the web card
 * @returns The profile if found, otherwise null
 */
export const getProfileByUserAndWebCard = async (
  userId: string,
  webCardId: string,
): Promise<Profile | null> =>
  db()
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.webCardId, webCardId),
      ),
    )
    .then(res => res[0] ?? null);

/**
 * Retrieves the list of profiles associated to a user
 *
 * @param userId - The id of the user
 * @returns The list of profiles associated to the user
 */
export const getProfilesByUser = async (userId: string): Promise<Profile[]> =>
  db().select().from(ProfileTable).where(eq(ProfileTable.userId, userId));

/**
 * Retrieves a user profiles list with the associated web card
 *
 * @param userId - The id of the user
 * @param profileRole - The role of the profile to filter on
 * @returns The list of profile associated to the user
 */
export const getUserProfilesWithWebCard = async (
  userId: string,
  profileRole?: Profile['profileRole'],
  limit?: number,
): Promise<Array<{ profile: Profile; webCard: WebCard }>> => {
  const query = db()
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.deleted, false),
        profileRole ? eq(ProfileTable.profileRole, profileRole) : undefined,
      ),
    )
    .orderBy(asc(WebCardTable.userName));

  const result = await (limit ? query.limit(limit) : query);
  return result.map(({ Profile, WebCard }) => ({
    profile: Profile,
    webCard: WebCard,
  }));
};

/**
 * Retrieves an associated profiles to an user for a webCard
 * @param userId - The id of the user
 * @param webCardId - The id of the webCard
 * @returns The list of profile associated to the user
 */
export const getProfile = async (userId: string, webCardId: string) => {
  return db()
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.webCardId, webCardId),
      ),
    )
    .limit(1)
    .then(res => res.map(({ Profile }) => Profile).pop());
};

/**
 * Retrieves the owner profile by the username
 *
 * @param userName - The userName of the profile to retrieve
 * @returns - The profile if found, otherwise null
 */
export const getOwnerProfileByUserName = async (
  userName: string,
): Promise<Profile | null> =>
  db()
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(
      and(
        eq(WebCardTable.userName, userName),
        eq(ProfileTable.deleted, false),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    )
    .then(([{ Profile: profile } = { Profile: null }]) => profile);

/**
 * Update the profiles of associated to a web card
 *
 * @param webCardId - The id of the web card
 * @param updates - The updates to apply to the profiles
 * @param profileIds - The list of profile ids to update,
 *  if not provided all profiles associated to the web card will be updated
 */
export const updateWebCardProfiles = async (
  webCardId: string,
  updates: Partial<Omit<Profile, 'id'>>,
  profileIds?: string[],
) => {
  await db()
    .update(ProfileTable)
    .set(updates)
    .where(
      profileIds
        ? and(
            eq(ProfileTable.webCardId, webCardId),
            inArray(ProfileTable.id, profileIds),
          )
        : eq(ProfileTable.webCardId, webCardId),
    );
};

/**
 * Update a profile
 *
 * @param profileId - The id of the profile
 * @param updates - The updates to apply to the profile
 */
export const updateProfile = async (
  profileId: string,
  updates: Partial<Omit<Profile, 'id'>>,
) => {
  await db()
    .update(ProfileTable)
    .set(updates)
    .where(eq(ProfileTable.id, profileId));
};

export const updateProfileForUserAndWebCard = async (
  userId: string,
  webCardId: string,
  updates: Partial<Omit<Profile, 'id'>>,
) => {
  await db()
    .update(ProfileTable)
    .set(updates)
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.webCardId, webCardId),
      ),
    );
};

/**
 * Increment the number of contact card scans for a profile
 *
 * @param profileId - The id of the profile
 */
export const incrementContactCardTotalScans = async (profileId: string) => {
  await db()
    .update(ProfileTable)
    .set({
      nbContactCardScans: sql`${ProfileTable.nbContactCardScans} + 1`,
    })
    .where(eq(ProfileTable.id, profileId));
};

/**
 * Increment the number of contact card scans for a profile
 *
 * @param profileId - The id of the profile
 */
export const incrementShareBacksTotal = async (profileId: string) => {
  await db()
    .update(ProfileTable)
    .set({
      nbShareBacks: sql`${ProfileTable.nbShareBacks} + 1`,
    })
    .where(eq(ProfileTable.id, profileId));
};

/**
 * Retrieves the list of profiles associated to a web card
 * @param webCardId - The id of the web card
 * @returns The list of profiles associated to the web card
 */
export const getProfilesByWebCard = async (
  webCardId: string,
): Promise<Profile[]> =>
  db().select().from(ProfileTable).where(eq(ProfileTable.webCardId, webCardId));

/**
 * Get the list of profiles associated to a web card ordered by role (owner, admin, editor, user)
 * then by first name and last name (asc)
 *
 * @param webCardId - The id of the web card
 * @param args
 * @param args.search - The search string to filter the profiles on
 * @param args.limit - The number of profiles to retrieve
 * @param args.after - The offset to start the retrieval
 *
 * @returns The list of profiles associated to the web card
 */
export const getWebCardProfiles = async (
  webCardId: string,
  {
    search,
    limit,
    after = 0,
  }: {
    search: string | null;
    limit: number;
    after: number;
  },
) =>
  (
    await db().execute(
      sql`SELECT Profile.* 
          FROM Profile
          INNER JOIN User ON Profile.userId = User.id
          WHERE webCardId = ${webCardId} 
          AND (
            ${search} IS NULL OR
            JSON_EXTRACT(contactCard, '$.firstName') LIKE ${`%${search}%`}
            OR JSON_EXTRACT(contactCard, '$.lastName') LIKE ${`%${search}%`}
            OR User.email LIKE ${`%${search}%`}
            OR User.phoneNumber LIKE ${`%${search}%`}
          ) 
          ORDER BY 
            CASE 
                WHEN profileRole = 'owner' THEN 1
                WHEN profileRole = 'admin' THEN 2
                WHEN profileRole = 'editor' THEN 3
                WHEN profileRole = 'user' THEN 4
                ELSE 5
            END ASC,
            JSON_EXTRACT(contactCard, '$.firstName'),
            JSON_EXTRACT(contactCard, '$.lastName')
          LIMIT ${limit} OFFSET ${after}`,
    )
  ).rows as Profile[];

/**
 * Count the number of profiles associated to a webCard
 *
 * @param webCardId - The id of the web card
 */
export const countWebCardProfiles = async (webCardId: string) =>
  db()
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .where(eq(ProfileTable.webCardId, webCardId))
    .then(res => res[0].count);

/**
 * Retrieves the pending owner profile for a web card if any
 *
 * @param webCardId - The id of the web card
 * @returns The profile if found, otherwise null
 */
export const getWebCardPendingOwnerProfile = async (
  webCardId: string,
): Promise<Profile | null> =>
  db()
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        eq(ProfileTable.promotedAsOwner, true),
      ),
    )
    .then(res => res[0] ?? null);

/**
 * Delete a profile by its id
 *
 * @param id - The id of the profile
 */
export const removeProfile = async (id: string) => {
  await transaction(async () => {
    const profile = await getProfileById(id);

    if (profile?.avatarId) {
      await db()
        .update(MediaTable)
        .set({ refCount: sql`${MediaTable.refCount} - 1` })
        .where(eq(MediaTable.id, profile.avatarId));
    }

    if (profile?.logoId) {
      await db()
        .update(MediaTable)
        .set({ refCount: sql`${MediaTable.refCount} - 1` })
        .where(eq(MediaTable.id, profile.logoId));
    }

    await db().delete(ProfileTable).where(eq(ProfileTable.id, id));
  });
};

const getAvatarAndLogo = async (profileIds: string[]) => {
  if (profileIds.length === 0) {
    return [];
  }
  return db()
    .select({
      avatarId: ProfileTable.avatarId,
      logoId: ProfileTable.logoId,
    })
    .from(ProfileTable)
    .where(inArray(ProfileTable.id, profileIds));
};

/**
 * Deletes multiple profiles by their ids
 *
 * @param profileIds - The list of profile ids to delete
 */
export const removeProfiles = async (profileIds: string[]) => {
  await transaction(async () => {
    const profiles = await getAvatarAndLogo(profileIds);

    const avatarIds = profiles
      .map(({ avatarId }) => avatarId)
      .filter(av => av !== null);

    if (avatarIds.length > 0) {
      await db()
        .update(MediaTable)
        .set({ refCount: sql`${MediaTable.refCount} - 1` })
        .where(inArray(MediaTable.id, avatarIds));
    }

    const logoIds = profiles
      .map(({ logoId }) => logoId)
      .filter(logo => logo !== null);

    if (logoIds.length > 0) {
      await db()
        .update(MediaTable)
        .set({ refCount: sql`${MediaTable.refCount} - 1` })
        .where(inArray(MediaTable.id, logoIds));
    }

    await db().delete(ProfileTable).where(inArray(ProfileTable.id, profileIds));
  });
};

/**
 * Delete all profiles associated to a web card except the owner
 *
 * @param webCardId - The id of the web card
 */
export const removeWebCardNonOwnerProfiles = async (webCardId: string) => {
  await db()
    .delete(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        ne(ProfileTable.profileRole, 'owner'),
      ),
    );
};

/**
 * Retrieves for a user the profiles that have a common web card with the targeted users
 *
 * @param userId - The id of the user
 * @param targetUserIds - The list of targeted users
 * @returns a record with as key the target user id and as value the profile of the user
 */
export const getCommonWebCardProfiles = async (
  userId: string,
  targetUserIds: readonly string[],
): Promise<Record<string, string[]>> => {
  const TargetProfileTable = alias(ProfileTable, 'TargetProfileTable');
  return db()
    .select({
      profileRole: ProfileTable.profileRole,
      targetUserId: TargetProfileTable.userId,
    })
    .from(ProfileTable)
    .innerJoin(
      TargetProfileTable,
      eq(ProfileTable.webCardId, TargetProfileTable.webCardId),
    )
    .where(
      and(
        eq(ProfileTable.userId, userId),
        inArray(TargetProfileTable.userId, targetUserIds as string[]),
      ),
    )
    .then(res =>
      res.reduce(
        (acc, { profileRole, targetUserId }) => {
          if (!acc[targetUserId]) {
            acc[targetUserId] = [];
          }
          acc[targetUserId].push(profileRole);
          return acc;
        },
        {} as Record<string, string[]>,
      ),
    );
};
