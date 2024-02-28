import { createId } from '@paralleldrive/cuid2';
import { and, asc, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import {
  boolean,
  json,
  mysqlTable,
  varchar,
  int,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import { FollowTable } from './follows';
import { WebCardTable } from './webCards';
import type { DbTransaction } from './db';
import type { WebCard } from './webCards';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const ProfileTable = mysqlTable(
  'Profile',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.cuid('webCardId').notNull(),
    profileRole: varchar('profileRole', {
      length: 6,
      enum: ['owner', 'admin', 'editor', 'user'],
    })
      .notNull()
      .default('owner'),
    invited: boolean('invited').default(false).notNull(),
    promotedAsOwner: boolean('promotedAsOwner').default(false).notNull(),
    avatarId: cols.mediaId('avatarId'),
    /* Contact cards infos */
    contactCard: json('contactCard').$type<ContactCard>(),
    contactCardIsPrivate: boolean('contactCardIsPrivate')
      .default(true)
      .notNull(),
    contactCardDisplayedOnWebCard: boolean('contactCardDisplayedOnWebCard')
      .default(false)
      .notNull(),
    createdAt: cols.dateTime('createdAt').notNull(),
    lastContactCardUpdate: cols.dateTime('lastContactCardUpdate').notNull(),
    nbContactCardScans: int('nbContactCardScans').default(0).notNull(),
  },
  table => {
    return {
      profileKey: uniqueIndex('Profile_user_webcard_key').on(
        table.userId,
        table.webCardId,
      ),
    };
  },
);

export type Profile = InferSelectModel<typeof ProfileTable>;
export type NewProfile = InferInsertModel<typeof ProfileTable>;

export const createProfile = async (
  profile: NewProfile,
  tx: DbTransaction = db,
) => {
  const id = createId();
  await tx.insert(ProfileTable).values({ ...profile, id });
  return id;
};

export const createProfiles = async (
  profiles: NewProfile[],
  tx: DbTransaction = db,
) => {
  await tx.insert(ProfileTable).ignore().values(profiles);
};

export const getProfileById = async (profileId: string) => {
  return db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.id, profileId))
    .then(res => res.pop() || null);
};

export const getProfileWithWebCardById = async (
  profileId: string,
): Promise<{ Profile: Profile; WebCard: WebCard } | null> => {
  return db
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(eq(ProfileTable.id, profileId))
    .then(res => res.pop() || null);
};

export const getUserProfileWithWebCardId = async (
  userId: string,
  webCardId: string,
) => {
  return db
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.webCardId, webCardId),
      ),
    )
    .then(res => res.pop() || null);
};

/**
 * Retrieves a list of associated profiles to an user
 * @param userId - The id of the user
 * @returns The list of profile associated to the user
 */
export const getProfilesOfUser = async (userId: string) => {
  return db
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(eq(ProfileTable.userId, userId))
    .orderBy(asc(WebCardTable.userName))
    .then(res => res.map(({ Profile }) => Profile));
};

/**
 * Retrieves an associated profiles to an user for a webCard
 * @param userId - The id of the user
 * @param webCardId - The id of the webCard
 * @returns The list of profile associated to the user
 */
export const getProfile = async (userId: string, webCardId: string) => {
  return db
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
export const getProfileByUserName = async (userName: string) => {
  return db
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(
      and(
        eq(WebCardTable.userName, userName),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    )
    .then(res => {
      const user = res.pop();

      if (!user) return null;
      return user.Profile;
    });
};

export const updateProfiles = async (
  webCardId: string,
  updates: Partial<Profile>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(ProfileTable)
    .set(updates)
    .where(eq(ProfileTable.webCardId, webCardId));
};

export const updateProfile = async (
  profileId: string,
  updates: Partial<Profile>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(ProfileTable)
    .set(updates)
    .where(eq(ProfileTable.id, profileId));
};
export const getRecommendedWebCards = async (
  profileId: string,
  webCardId: string,
): Promise<WebCard[]> => {
  return db
    .selectDistinct({
      WebCard: WebCardTable,
    })
    .from(WebCardTable)
    .innerJoin(ProfileTable, eq(ProfileTable.webCardId, WebCardTable.id))
    .leftJoin(
      FollowTable,
      and(
        eq(FollowTable.followingId, WebCardTable.id),
        eq(FollowTable.followerId, webCardId),
      ),
    )
    .where(
      and(
        ne(WebCardTable.id, webCardId),
        isNull(FollowTable.followerId),
        eq(WebCardTable.cardIsPublished, true),
      ),
    )
    .orderBy(desc(WebCardTable.createdAt))
    .then(res => res.map(({ WebCard }) => WebCard));
};

export const updateContactCardTotalScans = async (
  profileId: string,
  tx: DbTransaction = db,
) => {
  await tx
    .update(ProfileTable)
    .set({
      nbContactCardScans: sql`${ProfileTable.nbContactCardScans} + 1`,
    })
    .where(eq(ProfileTable.id, profileId));
};

/**
 * Get the list of profiles associated to a webCard orderby role (owner, admin, editor, user)
 * then by firstname and lastname (asc)
 *
 * @param {string} webCardId
 * @param {{
 *     limit: number;
 *     after: number;
 *   }} {
 *     limit,
 *     after = 0,
 *   }
 * @param {DbTransaction} [tx=db]
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
  tx: DbTransaction = db,
) =>
  (
    await tx.execute(
      sql`SELECT * 
          FROM Profile
          WHERE webCardId = ${webCardId} 
          AND (
            ${search} IS NULL OR
            JSON_EXTRACT(contactCard, '$.firstName') LIKE ${
              '%' + search + '%'
            } OR
            JSON_EXTRACT(contactCard, '$.lastName') LIKE ${'%' + search + '%'}
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
 * The the profile owner of a webcard
 *
 * @param {string} webCardId
 * @param {DbTransaction} [tx=db]
 * @returns {Promise<Profile[]>} the list of profiles that are owner (for now there is only one)
 */
export const getWebCardOwnerProfile = async (
  webCardId: string,
  tx: DbTransaction = db,
) =>
  tx
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    );
/**
 * Count the number of profiles associated to a webCard
 *
 * @param {string} webCardId
 * @param {DbTransaction} [tx=db]
 */
export const countWebCardProfiles = async (
  webCardId: string,
  tx: DbTransaction = db,
) =>
  tx
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)
    .where(eq(ProfileTable.webCardId, webCardId))
    .then(res => res[0].count);

/**
 *
 *
 * @param {string} webCardId
 * @param {DbTransaction} [tx=db]
 * @returns {Promise<Profile[]>} the list of profiles that are pending to be owner
 */
export const getWebCardPendingOwnerProfile = async (
  webCardId: string,
  tx: DbTransaction = db,
) =>
  tx
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        eq(ProfileTable.promotedAsOwner, true),
      ),
    );
