import { eq, and, or, ne, inArray, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import {
  PostTable,
  ProfileTable,
  UserSubscriptionTable,
  UserTable,
  WebCardTable,
  db,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#__generated__/types';

const deleteUser: MutationResolvers['deleteUser'] = async (
  _,
  _args,
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  if (!auth.userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const userId = auth.userId;
  const updates = {
    deletedAt: new Date(),
    deletedBy: userId,
    deleted: true,
  };

  if ((await loaders.activeSubscriptionsLoader.load(userId)).length > 0) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
  }

  await db.transaction(async trx => {
    await trx.update(UserTable).set(updates).where(eq(UserTable.id, userId));

    const webCards = await trx
      .select({ id: WebCardTable.id, userName: WebCardTable.userName })
      .from(WebCardTable)
      .innerJoin(ProfileTable, eq(WebCardTable.id, ProfileTable.webCardId))
      .where(
        and(
          eq(WebCardTable.deleted, false),
          eq(ProfileTable.profileRole, 'owner'),
          eq(ProfileTable.userId, userId),
        ),
      );

    const webCardIds = webCards.map(wc => wc.id);

    if (webCardIds.length > 0) {
      await trx
        .update(WebCardTable)
        .set({
          ...updates,
          cardIsPublished: false,
        })
        .where(inArray(WebCardTable.id, webCardIds));

      await trx
        .update(PostTable)
        .set(updates)
        .where(
          and(
            inArray(PostTable.webCardId, webCardIds),
            or(eq(PostTable.deleted, false), ne(PostTable.deletedBy, userId)),
          ),
        );

      await trx
        .update(WebCardTable)
        .set({
          nbPostsLiked: sql`GREATEST(nbPostsLiked - 1, 0)`,
        })
        .where(
          inArray(
            WebCardTable.id,
            sql`(select r.webCardId from PostReaction r inner join Post p on p.id = r.postId where p.webCardId in ${webCardIds})`,
          ),
        );

      const nonOwnerWebCards = await trx
        .select({ id: WebCardTable.id, userName: WebCardTable.userName })
        .from(WebCardTable)
        .innerJoin(ProfileTable, eq(WebCardTable.id, ProfileTable.webCardId))
        .where(
          and(
            eq(WebCardTable.deleted, false),
            eq(ProfileTable.deleted, false),
            ne(ProfileTable.profileRole, 'owner'),
            eq(ProfileTable.userId, userId),
          ),
        );

      const nonOwnerWebCardIds = nonOwnerWebCards.map(wc => wc.id);

      if (nonOwnerWebCardIds.length > 0) {
        await trx
          .update(UserSubscriptionTable)
          .set({
            totalSeats: sql`GREATEST(totalSeats - 1, 0)`,
          })
          .where(
            and(
              eq(UserSubscriptionTable.subscriptionPlan, 'web.monthly'),
              eq(UserSubscriptionTable.status, 'active'),
              inArray(UserSubscriptionTable.webCardId, nonOwnerWebCardIds),
            ),
          );
      }

      await trx
        .update(ProfileTable)
        .set(updates)
        .where(
          or(
            inArray(ProfileTable.webCardId, webCardIds),
            and(
              eq(ProfileTable.userId, userId),
              eq(ProfileTable.deleted, false),
            ),
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
            sql`(select followingId from Follow where followerId in ${webCardIds})`,
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
            sql`(select followerId from Follow where followingId in ${webCardIds})`,
          ),
        );

      webCards.forEach(wc => cardUsernamesToRevalidate.add(wc.userName));
    }
  });

  const user = await loaders.User.load(userId);

  if (!user) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  return user;
};

export default deleteUser;
