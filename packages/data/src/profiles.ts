import { and, asc, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { FollowTable } from './follows';
import { createId } from './helpers/createId';
import { UserTable } from './users';
import { WebCardTable } from './webCards';
import type { DbTransaction } from './db';
import type { WebCard } from './webCards';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const ProfileTable = cols.table(
  'Profile',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.cuid('webCardId').notNull(),
    profileRole: cols
      .varchar('profileRole', {
        length: 6,
        enum: ['owner', 'admin', 'editor', 'user'],
      })
      .notNull()
      .default('owner'),
    invited: cols.boolean('invited').default(false).notNull(),
    inviteSent: cols.boolean('inviteSent').default(false).notNull(),
    promotedAsOwner: cols.boolean('promotedAsOwner').default(false).notNull(),
    avatarId: cols.mediaId('avatarId'),
    logoId: cols.mediaId('logoId'),
    /* Contact cards infos */
    contactCard: cols.json('contactCard').$type<ContactCard>(),
    contactCardIsPrivate: cols
      .boolean('contactCardIsPrivate')
      .default(true)
      .notNull(),
    contactCardDisplayedOnWebCard: cols
      .boolean('contactCardDisplayedOnWebCard')
      .default(false)
      .notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    lastContactCardUpdate: cols
      .dateTime('lastContactCardUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    nbContactCardScans: cols.int('nbContactCardScans').default(0).notNull(),
    deleted: cols.boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
  },
  table => {
    return {
      profileKey: cols
        .uniqueIndex('Profile_user_webcard_key')
        .on(table.userId, table.webCardId),
      webCardKey: cols
        .index('Profile_webCardId_key')
        .on(table.webCardId, table.profileRole),
      promotedAsOwnerKey: cols
        .index('Profile_promotedAsOwner_key')
        .on(table.webCardId, table.promotedAsOwner),
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
export const getProfilesOfUser = async (userId: string, limit?: number) => {
  const query = db
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(
      and(eq(ProfileTable.userId, userId), eq(ProfileTable.deleted, false)),
    )
    .orderBy(asc(WebCardTable.userName));

  return limit ? query.limit(limit) : query;
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
        eq(ProfileTable.deleted, false),
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
  profileIds?: string[],
  tx: DbTransaction = db,
) => {
  await tx
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
        eq(WebCardTable.deleted, false),
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

export const getOwners = async (webCardIds: string[]) => {
  return db
    .select({
      user: UserTable,
      webCardId: ProfileTable.webCardId,
    })
    .from(ProfileTable)
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .where(
      and(
        inArray(ProfileTable.webCardId, webCardIds),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    );
};

export const getUsersFromWebCardId = async (
  webCardId: string,
  profileIds?: string[],
) => {
  return db
    .select({
      profileId: ProfileTable.id,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      id: UserTable.id,
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
};

export const removeProfileById = async (
  id: string,
  trx: DbTransaction = db,
) => {
  await trx.delete(ProfileTable).where(eq(ProfileTable.id, id));
};
