import { eq, sql, lt, desc, and, ne, inArray } from 'drizzle-orm';
import { PostTable } from '#posts';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { FollowTable } from './follows';
import { createId } from './helpers/createId';
import { ProfileTable } from './profiles';
import { RedirectWebCardTable } from './redirectWebCard';
import { getUserById } from './users';
import type { DbTransaction } from './db';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type {
  CommonInformation,
  ContactCard,
} from '@azzapp/shared/contactCardHelpers';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const WebCardTable = cols.table(
  'WebCard',
  {
    /* Profile infos */
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userName: cols.defaultVarchar('userName').notNull(),
    lastUserNameUpdate: cols
      .dateTime('lastUserNameUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    webCardKind: cols.enum('webCardKind', ['personal', 'business']).notNull(),
    webCardCategoryId: cols.cuid('webCardCategoryId'),
    firstName: cols.defaultVarchar('firstName'),
    lastName: cols.defaultVarchar('lastName'),
    logoId: cols.mediaId('logoId'),
    commonInformation: cols
      .json('commonInformation')
      .$type<CommonInformation>(),
    companyName: cols.defaultVarchar('companyName'),
    companyActivityId: cols.cuid('companyActivityId'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    isMultiUser: cols.boolean('isMultiUser').default(false).notNull(),

    /* Cards infos */
    locale: cols.defaultVarchar('locale'),
    cardColors: cols.json('cardColors').$type<{
      primary: string;
      light: string;
      dark: string;
      otherColors: string[];
    } | null>(),
    cardStyle: cols.json('cardStyle').$type<CardStyle>(),
    cardIsPrivate: cols.boolean('cardIsPrivate').default(false).notNull(),
    cardIsPublished: cols.boolean('cardIsPublished').default(false).notNull(),
    alreadyPublished: cols.boolean('alreadyPublished').default(false).notNull(),
    lastCardUpdate: cols
      .dateTime('lastCardUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),

    /* Covers infos */
    coverMediaId: cols.mediaId('coverMediaId'),
    coverTexts: cols.json('coverTexts').$type<string[]>(),
    coverBackgroundColor: cols.defaultVarchar('coverBackgroundColor'),
    coverDynamicLinks: cols
      .json('coverDynamicLinks')
      .$type<CoverDynamicLinks>()
      .notNull()
      .default({
        links: [],
        color: '#000000',
        size: 24,
        position: {
          x: 0,
          y: 0,
        },
        rotation: 0,
        shadow: false,
      }),

    /* Social medias infos */
    nbFollowers: cols.int('nbFollowers').default(0).notNull(),
    nbFollowings: cols.int('nbFollowings').default(0).notNull(),
    nbPosts: cols.int('nbPosts').default(0).notNull(),
    nbPostsLiked: cols.int('nbPostsLiked').default(0).notNull(), // this is the informations postLiked
    nbLikes: cols.int('nbLikes').default(0).notNull(), //this is the stats TotalLikes (number of likes received)
    nbWebCardViews: cols.int('nbWebCardViews').default(0).notNull(),

    /* Deletion infos */
    deleted: cols.boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
  },
  table => {
    return {
      userNameKey: cols.uniqueIndex('WebCard_userName_key').on(table.userName),
      webCardSearch: cols.fulltextIndex('WebCard_search').on(table.userName),
    };
  },
);

export type WebCard = InferSelectModel<typeof WebCardTable>;
export type NewWebCard = InferInsertModel<typeof WebCardTable>;

export type CoverDynamicLinks = {
  links: Array<{
    link: string;
    position: number;
    socialId: string;
  }>;
  color: string;
  size: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  shadow: boolean;
};

/**
 * Retrieves a webCard by its id
 * @param id - The id of the webCard to retrieve
 * @returns The webCard if found, otherwise null
 */
export const getWebCardById = async (id: string) =>
  db
    .select()
    .from(WebCardTable)
    .where(eq(WebCardTable.id, id))
    .then(res => res[0] ?? null);

/**
 * Retrieve the list of webCard a webCard is following
 * @param webCardId - The id of the webCard
 * @param params - The parameters to filter the result
 * @returns A list of webCard
 */
export const getFollowings = async (
  webCardId: string,
  params: { userName?: string | null },
) => {
  const result = await db
    .select()
    .from(WebCardTable)
    .innerJoin(FollowTable, eq(FollowTable.followingId, WebCardTable.id))
    .where(
      and(
        eq(FollowTable.followerId, webCardId),
        params.userName
          ? sql`MATCH (${WebCardTable.userName}) AGAINST ("${params.userName}*" IN BOOLEAN MODE)`
          : undefined,
      ),
    );

  return result.map(({ WebCard }) => WebCard);
};

/**
 * Retrieve the list of webCard a webCard is being followed
 * @param webCardId - The id of the webCard
 * @param params - The parameters to filter the result
 * @returns the list of webCard a webCard is being followed
 */
export const getFollowerProfiles = async (
  webCardId: string,
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
      webCard: WebCardTable,
      followCreatedAt: FollowTable.createdAt,
    })
    .from(WebCardTable)
    .innerJoin(FollowTable, eq(FollowTable.followerId, WebCardTable.id))
    .where(
      and(
        eq(FollowTable.followingId, webCardId),
        eq(WebCardTable.deleted, false),
        after ? lt(FollowTable.createdAt, after) : undefined,
        userName
          ? sql`MATCH (${WebCardTable.userName}) AGAINST ("${userName}*" IN BOOLEAN MODE)`
          : undefined,
      ),
    )
    .orderBy(desc(FollowTable.createdAt))
    .limit(limit);

/**
 * Retrieve the list of webCard a webCard is following
 * @param webCardId - The id of the webCard
 * @returns the list of webCard a webCardis following
 */
export const getFollowingsWebCard = async (
  webCardId: string,
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
      webCard: WebCardTable,
      followCreatedAt: FollowTable.createdAt,
    })
    .from(WebCardTable)
    .innerJoin(FollowTable, eq(FollowTable.followingId, WebCardTable.id))
    .where(
      and(
        eq(FollowTable.followerId, webCardId),
        eq(WebCardTable.deleted, false),
        after ? lt(FollowTable.createdAt, after) : undefined,
        userName
          ? sql`MATCH (${WebCardTable.userName}) AGAINST ("${userName}*" IN BOOLEAN MODE)`
          : undefined,
      ),
    )
    .orderBy(desc(FollowTable.createdAt))
    .limit(limit);

/**
 * Create a new webCard
 * @param data - The webCard fields, excluding the id
 * @returns The newly created webCard
 */
export const createWebCard = async (
  data: NewWebCard,
  tx: DbTransaction = db,
): Promise<string> => {
  const id = createId();
  await tx.insert(WebCardTable).values({ ...data, id });
  return id;
};

export const updateWebCard = async (
  webCardId: string,
  updates: Partial<WebCard>,
  trx = db.client(),
) => {
  await trx
    .update(WebCardTable)
    .set(updates)
    .where(eq(WebCardTable.id, webCardId));
};

/**
 * Build a default contact card from a webCard and a user
 * @param webCard
 * @returns
 */
export const buildDefaultContactCard = async (
  webCard: NewWebCard,
  userId: string,
): Promise<ContactCard> => {
  const user = await getUserById(userId);
  return {
    firstName: webCard.firstName,
    lastName: webCard.lastName,
    company: webCard.companyName,
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

/**
 * Retrieves a webCard by their webCardname
 *
 * @param webCardName - The webCardname of the webCard to retrieve
 * @returns - The webCard if found, otherwise null
 */
export const getWebCardByUserName = async (webCardName: string) => {
  return db
    .select()
    .from(WebCardTable)
    .where(eq(WebCardTable.userName, webCardName))
    .then(res => res.pop() ?? null);
};

/**
 * Retrieves a webcard by their webcard handling redirection
 *
 * @param userName - The username of the webcard to retrieve
 * @returns - The profile if found, otherwise null
 */
export const getWebCardByUserNameWithRedirection = async (
  profileName: string,
) => {
  const webCard = await db
    .select()
    .from(WebCardTable)
    .where(eq(WebCardTable.userName, profileName))
    .then(res => res.pop() ?? null);

  if (webCard) {
    return webCard;
  }

  const redirectionList = await db
    .select()
    .from(RedirectWebCardTable)
    .where(eq(RedirectWebCardTable.fromUserName, profileName));

  if (redirectionList.length > 0) {
    const redirection = redirectionList[0];
    if (redirection.expiresAt && redirection.expiresAt > new Date()) {
      //delete the expired redirection
      db.delete(RedirectWebCardTable).where(
        eq(RedirectWebCardTable.fromUserName, profileName),
      );

      return null;
    }

    const webCard = await db
      .select()
      .from(WebCardTable)
      .where(eq(WebCardTable.userName, redirection.toUserName))
      .then(res => res.pop() ?? null);

    return webCard;
  }

  return null;
};

export const getWebCardByProfileId = (id: string): Promise<WebCard | null> => {
  return db
    .client()
    .select()
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(eq(ProfileTable.id, id))
    .then(results => {
      const result = results.pop();
      if (!result) return null;

      return result.WebCard;
    });
};

export const getWebCardProfilesCount = async (
  webCardId: string,
  trx: DbTransaction = db,
) =>
  trx
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ProfileTable)

    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        ne(ProfileTable.deleted, true),
      ),
    )
    .then(res => res[0].count);

export const deleteWebCard = async (
  webCardId: string,
  userId: string,
  trx: DbTransaction,
) => {
  await trx
    .update(WebCardTable)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
      deleted: true,
      cardIsPublished: false,
    })
    .where(eq(WebCardTable.id, webCardId));

  await trx
    .update(ProfileTable)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
      deleted: true,
    })
    .where(eq(ProfileTable.webCardId, webCardId));

  await trx
    .update(PostTable)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
      deleted: true,
    })
    .where(eq(PostTable.webCardId, webCardId));

  await trx
    .update(WebCardTable)
    .set({
      nbPostsLiked: sql`GREATEST(nbPostsLiked - 1, 0)`,
    })
    .where(
      inArray(
        WebCardTable.id,
        sql`(select r.webCardId from PostReaction r inner join Post p on p.id = r.postId where p.webCardId = ${webCardId})`,
      ),
    );

  await trx
    .update(WebCardTable)
    .set({
      nbFollowers: sql`GREATEST(nbFollowers - 1, 0)`,
    })
    .where(
      inArray(
        WebCardTable.id,
        sql`(select followingId from Follow where followerId = ${webCardId})`,
      ),
    );

  await trx
    .update(WebCardTable)
    .set({
      nbFollowings: sql`GREATEST(nbFollowings - 1, 0)`,
    })
    .where(
      inArray(
        WebCardTable.id,
        sql`(select followerId from Follow where followingId = ${webCardId})`,
      ),
    );
};
