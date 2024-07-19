'use server';

import * as Sentry from '@sentry/nextjs';
import { eq, ne, and, inArray, sql, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  getUserById,
  updateUser,
  db,
  WebCardTable,
  ProfileTable,
  getUserProfileWithWebCardId,
  UserTable,
  deleteWebCard,
  PostTable,
} from '@azzapp/data';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { getSession } from '#helpers/session';

export const toggleRole = async (userId: string, role: string) => {
  if (!(await currentUserHasRole(ADMIN))) {
    return null;
  }

  const user = await getUserById(userId);

  if (!user) {
    return null;
  }
  if (user.roles?.includes(role)) {
    await updateUser(userId, {
      roles: user.roles.filter(r => r !== role),
    });
  } else {
    await updateUser(userId, {
      roles: [...(user.roles ?? []), role],
    });
  }

  revalidatePath(`/users/${userId}`);
};

export const removeWebcard = async (userId: string, webcardId: string) => {
  const session = await getSession();

  const profile = await getUserProfileWithWebCardId(userId, webcardId);

  if (session?.userId && profile) {
    const updates = {
      deletedAt: new Date(),
      deletedBy: session.userId,
      deleted: true,
    };

    await db.transaction(async trx => {
      if (profile.profileRole === 'owner') {
        await deleteWebCard(webcardId, userId, trx);
      } else {
        await trx
          .update(ProfileTable)
          .set(updates)
          .where(
            and(
              eq(ProfileTable.webCardId, webcardId),
              eq(ProfileTable.userId, userId),
            ),
          );
      }
    });
    revalidatePath(`/users/${userId}`);
  }
};

export const toggleUserActive = async (userId: string) => {
  const user = await getUserById(userId);

  const session = await getSession();

  if (user && session?.userId) {
    const deleteFlagsUpdate = {
      deleted: !user.deleted,
      deletedAt: user.deleted ? null : new Date(),
      deletedBy: user.deleted ? null : session.userId,
    };

    await db.transaction(async trx => {
      await trx
        .update(UserTable)
        .set(deleteFlagsUpdate)
        .where(eq(UserTable.id, userId));

      const webCards = await trx
        .select({ id: WebCardTable.id, userName: WebCardTable.userName })
        .from(WebCardTable)
        .innerJoin(ProfileTable, eq(WebCardTable.id, ProfileTable.webCardId))
        .where(
          and(
            or(
              eq(WebCardTable.deleted, false),
              ne(WebCardTable.deletedBy, userId),
            ),
            eq(ProfileTable.profileRole, 'owner'),
            eq(ProfileTable.userId, userId),
          ),
        );

      const webCardIds = webCards.map(wc => wc.id);

      if (webCardIds.length > 0) {
        await trx
          .update(WebCardTable)
          .set({
            ...deleteFlagsUpdate,
            cardIsPublished: false,
          })
          .where(inArray(WebCardTable.id, webCardIds));

        await trx
          .update(PostTable)
          .set(deleteFlagsUpdate)
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

        await trx
          .update(ProfileTable)
          .set(deleteFlagsUpdate)
          .where(
            or(
              inArray(ProfileTable.webCardId, webCardIds),
              and(
                eq(ProfileTable.userId, userId),
                or(
                  eq(ProfileTable.deleted, false),
                  ne(ProfileTable.deletedBy, userId),
                ),
              ),
            ),
          );

        await trx
          .update(WebCardTable)
          .set({
            nbFollowers: user.deleted
              ? sql`GREATEST(nbFollowers + 1, 0)`
              : sql`GREATEST(nbFollowers - 1, 0)`,
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
            nbFollowings: user.deleted
              ? sql`GREATEST(nbFollowings + 1, 0)`
              : sql`GREATEST(nbFollowings - 1, 0)`,
          })
          .where(
            inArray(
              WebCardTable.id,
              sql`(select followerId from Follow where followingId in ${webCardIds})`,
            ),
          );
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
            },
            body: JSON.stringify({
              cards: webCards.map(({ userName }) => userName),
              posts: [],
            }),
          },
        );

        if (!res.ok) {
          throw new Error(res.statusText, { cause: res });
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    });
  }

  revalidatePath(`/users/${userId}`);
};

export const updateNote = async (userId: string, note: string) => {
  try {
    await updateUser(userId, {
      note,
    });
  } catch (e) {
    Sentry.captureException(e);
    throw e;
  }

  revalidatePath(`/users/${userId}`);
};
