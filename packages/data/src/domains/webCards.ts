import { eq, sql, lt, desc, and } from 'drizzle-orm';
import {
  mysqlEnum,
  uniqueIndex,
  fulltextIndex,
  mysqlTable,
  json,
  boolean,
  int,
} from 'drizzle-orm/mysql-core';
import { createId } from '#helpers/createId';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { FollowTable } from './follows';
import { RedirectWebCardTable } from './redirectWebCard';
import { getUserById } from './users';
import type { DbTransaction } from './db';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type {
  CommonInformation,
  ContactCard,
} from '@azzapp/shared/contactCardHelpers';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const WebCardTable = mysqlTable(
  'WebCard',
  {
    /* Profile infos */
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userName: cols.defaultVarchar('userName').notNull(),
    lastUserNameUpdate: cols
      .dateTime('lastUserNameUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    webCardKind: mysqlEnum('webCardKind', ['personal', 'business']).notNull(),
    webCardCategoryId: cols.cuid('webCardCategoryId'),
    firstName: cols.defaultVarchar('firstName'),
    lastName: cols.defaultVarchar('lastName'),
    commonInformation: json('commonInformation').$type<CommonInformation>(),
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
    isMultiUser: boolean('isMultiUser').default(false).notNull(),

    /* Cards infos */
    locale: cols.defaultVarchar('locale'),
    cardColors: json('cardColors').$type<{
      primary: string;
      light: string;
      dark: string;
      otherColors: string[];
    } | null>(),
    cardStyle: json('cardStyle').$type<CardStyle>(),
    cardIsPrivate: boolean('cardIsPrivate').default(false).notNull(),
    cardIsPublished: boolean('cardIsPublished').default(false).notNull(),
    alreadyPublished: boolean('alreadyPublished').default(false).notNull(),
    lastCardUpdate: cols
      .dateTime('lastCardUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),

    /* Covers infos */
    coverTitle: cols.defaultVarchar('coverTitle'),
    coverSubTitle: cols.defaultVarchar('coverSubTitle'),
    coverData: json('coverData').$type<{
      kind: 'others' | 'people' | 'video' | null;
      titleStyle: TextStyle;
      subTitleStyle: TextStyle;
      textOrientation: TextOrientation;
      textPosition: TextPosition;
      textAnimation?: string | null;
      backgroundId?: string | null;
      backgroundColor?: string | null;
      backgroundPatternColor?: string | null;
      foregroundId?: string | null;
      foregroundColor?: string | null;
      sourceMediaId: string | null;
      maskMediaId?: string | null;
      mediaFilter?: string | null;
      mediaAnimation?: string | null;
      mediaParameters?: Record<string, any> | null;
      mediaId?: string | null;
      segmented: boolean;
    }>(),
    nbFollowers: int('nbFollowers').default(0).notNull(),
    nbFollowings: int('nbFollowings').default(0).notNull(),
    nbPosts: int('nbPosts').default(0).notNull(),
    nbPostsLiked: int('nbPostsLiked').default(0).notNull(), // this is the informations postLiked
    nbLikes: int('nbLikes').default(0).notNull(), //this is the stats TotalLikes (number of likes received)
    nbWebCardViews: int('nbWebCardViews').default(0).notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
  },
  table => {
    return {
      userNameKey: uniqueIndex('WebCard_userName_key').on(table.userName),
      webCardSearch: fulltextIndex('WebCard_search').on(table.userName),
    };
  },
);

export type WebCard = InferSelectModel<typeof WebCardTable>;
export type NewWebCard = InferInsertModel<typeof WebCardTable>;

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
  tx: DbTransaction = db,
) => {
  await tx
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
