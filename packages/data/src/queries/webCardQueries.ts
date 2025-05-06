import {
  eq,
  sql,
  lt,
  desc,
  and,
  ne,
  inArray,
  isNull,
  like,
  or,
  count,
  isNotNull,
} from 'drizzle-orm';
import { db, transaction } from '../database';
import { createId } from '../helpers/createId';
import {
  FCMTokenTable,
  FollowTable,
  PostTable,
  ProfileTable,
  RedirectWebCardTable,
  UserTable,
  WebCardTable,
} from '../schema';
import { getUserById } from './userQueries';
import type { WebCard } from '../schema';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieves a web card by its id
 *
 * @param id - The id of the web card to retrieve
 * @returns The web card if found, otherwise null
 */
export const getWebCardById = async (id: string): Promise<WebCard | null> =>
  db()
    .select()
    .from(WebCardTable)
    .where(eq(WebCardTable.id, id))
    .then(res => res[0] ?? null);

/**
 * Search for web cards
 *
 * @param args - The arguments to filter the result
 * @param args.limit - The number of web cards to retrieve
 * @param args.after - The date to start the search from
 * @param args.search - The search query
 *
 * @returns
 */
export const searchWebCards = ({
  limit,
  after = null,
  search,
}: {
  limit: number;
  after?: Date | null;
  search?: string;
}): Promise<WebCard[]> =>
  db()
    .select()
    .from(WebCardTable)
    .where(
      and(
        eq(WebCardTable.cardIsPublished, true),
        eq(WebCardTable.deleted, false),
        eq(WebCardTable.coverIsPredefined, false),
        isNotNull(WebCardTable.userName),
        after ? lt(WebCardTable.createdAt, after) : undefined,
        search
          ? or(
              like(WebCardTable.userName, `%${search}%`),
              like(WebCardTable.firstName, `%${search}%`),
              like(WebCardTable.lastName, `%${search}%`),
            )
          : undefined,
      ),
    )
    .limit(limit)
    .orderBy(desc(WebCardTable.createdAt));

/**
 * Retrieve the list of web card a web card is being followed
 *
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
  db()
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
 * Retrieve the list of followed webCard
 * @param webCardId - The id of the webCard
 * @param params - The parameters to filter the result
 * @param params.limit - The number of webCard to retrieve
 * @param params.after - The date to start the search from
 * @param params.userName - The username to search for
 *
 * @returns the list of web card that are being followed by the web card
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
  db()
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
 * @param data - The webCard fields
 * @returns The newly created webCard
 */
export const createWebCard = async (
  data: InferInsertModel<typeof WebCardTable>,
): Promise<string> => {
  const id = createId();
  await db()
    .insert(WebCardTable)
    .values({ ...data, id });
  return id;
};

export const updateWebCard = async (
  webCardId: string,
  updates: Partial<WebCard>,
) => {
  await db()
    .update(WebCardTable)
    .set(updates)
    .where(eq(WebCardTable.id, webCardId));
};

/**
 * Increment the number of views of a webCard
 * @param webCardId - The id of the webCard
 */
export const incrementWebCardPosts = async (webCardId: string) => {
  await db()
    .update(WebCardTable)
    .set({
      nbPosts: sql`nbPosts + 1`,
    })
    .where(eq(WebCardTable.id, webCardId));
};

export const getWebCardCountProfile = async (webCardId: string) => {
  const profiles = await db()
    .select({ count: count() })
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        ne(ProfileTable.deleted, true),
      ),
    )
    .then(rows => rows[0].count);

  return profiles;
};

/**
 * Build a default contact card from a webCard and a user
 * @param webCard
 * @returns
 */
export const buildDefaultContactCard = async (
  webCard: InferInsertModel<typeof WebCardTable>,
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
          },
        ]
      : null,
    phoneNumbers: user?.phoneNumber
      ? [
          {
            number: user.phoneNumber,
            label: 'Home',
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
  return db()
    .select()
    .from(WebCardTable)
    .where(eq(WebCardTable.userName, webCardName))
    .then(res => res[0] ?? null);
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
  const webCard = await db()
    .select()
    .from(WebCardTable)
    .where(eq(WebCardTable.userName, profileName))
    .then(res => res[0] ?? null);

  if (webCard) {
    return webCard;
  }

  const redirectionList = await db()
    .select()
    .from(RedirectWebCardTable)
    .where(eq(RedirectWebCardTable.fromUserName, profileName));

  if (redirectionList.length > 0) {
    const redirection = redirectionList[0];
    if (redirection.expiresAt && redirection.expiresAt > new Date()) {
      //delete the expired redirection
      db()
        .delete(RedirectWebCardTable)
        .where(eq(RedirectWebCardTable.fromUserName, profileName));

      return null;
    }

    const webCard = await db()
      .select()
      .from(WebCardTable)
      .where(eq(WebCardTable.userName, redirection.toUserName))
      .then(res => res[0] ?? null);

    return webCard;
  }

  return null;
};

/**
 * Retrieves a webcard by their webcard handling redirection
 *
 * @param userName - The username of the webcard to retrieve
 * @returns - The profile if found, otherwise null
 */
export const getWebCardByUserNamePrefixWithRedirection = async (
  profileName: string,
) => {
  const matchPrefix = `${profileName}[0-9]*$`;

  const webCard = await db()
    .select({ userName: WebCardTable.userName })
    .from(WebCardTable)
    .where(
      and(
        like(WebCardTable.userName, `${profileName}%`),
        sql`userName REGEXP ${matchPrefix}`,
      ),
    )
    .limit(1000)
    .then(res => res.map(res => res.userName) ?? null);

  const redirectionList = await db()
    .select({ toUserName: RedirectWebCardTable.toUserName })
    .from(RedirectWebCardTable)
    .where(
      and(
        like(RedirectWebCardTable.toUserName, `${profileName}%`),
        sql`toUserName REGEXP ${matchPrefix}`,
      ),
    )
    .limit(1000)
    .then(res => res.map(res => res.toUserName) ?? null);

  return [...webCard, ...redirectionList];
};

export const getWebCardByProfileId = (id: string): Promise<WebCard | null> => {
  return db()
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

export const getWebCardByUserId = (userId: string): Promise<WebCard[]> => {
  return db()
    .select({ WebCard: WebCardTable })
    .from(ProfileTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    )
    .then(results => results.map(w => w.WebCard));
};

export const getRecommendedWebCards = async (
  webCardId: string,
): Promise<WebCard[]> => {
  return db()
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
        isNotNull(WebCardTable.userName),
        eq(WebCardTable.cardIsPublished, true),
        eq(WebCardTable.deleted, false),
        eq(WebCardTable.coverIsPredefined, false),
      ),
    )
    .orderBy(desc(WebCardTable.starred), desc(WebCardTable.createdAt))
    .then(res => res.map(({ WebCard }) => WebCard));
};

export const markWebCardAsDeleted = async (webCardId: string, userId: string) =>
  transaction(async () => {
    await db()
      .update(WebCardTable)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
        deleted: true,
        cardIsPublished: false,
      })
      .where(eq(WebCardTable.id, webCardId));

    await db()
      .update(ProfileTable)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
        deleted: true,
      })
      .where(eq(ProfileTable.webCardId, webCardId));

    await db()
      .update(PostTable)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
        deleted: true,
      })
      .where(eq(PostTable.webCardId, webCardId));

    await db()
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

    await db()
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

    await db()
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
  });

export const getUsersToNotifyOnWebCard = async (
  webCardId: string,
  excludedUserId: string,
) => {
  return db()
    .selectDistinct({
      user: UserTable,
    })
    .from(UserTable)
    .innerJoin(ProfileTable, eq(ProfileTable.userId, UserTable.id))
    .innerJoin(FCMTokenTable, eq(FCMTokenTable.userId, UserTable.id)) // Only users with FCM token can be notified
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        ne(ProfileTable.deleted, true),
        ne(UserTable.deleted, true),
        ne(UserTable.id, excludedUserId),
      ),
    )
    .then(res => res.map(({ user }) => user));
};
