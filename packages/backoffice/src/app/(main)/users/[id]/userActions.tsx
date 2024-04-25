'use server';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  getUserById,
  updateUser,
  db,
  WebCardTable,
  ProfileTable,
  getUserProfileWithWebCardId,
} from '@azzapp/data';
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
        await trx
          .update(WebCardTable)
          .set({
            ...updates,
            cardIsPublished: false,
          })
          .where(eq(WebCardTable.id, webcardId));

        await trx
          .update(ProfileTable)
          .set(updates)
          .where(eq(ProfileTable.webCardId, webcardId));

        await trx
          .update(WebCardTable)
          .set({
            nbFollowers: sql`GREATEST(nbFollowers - 1, 0)`,
          })
          .where(
            inArray(
              WebCardTable.id,
              sql`(select followingId from Follow where followerId = "${webcardId}")`,
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
              sql`(select followerId from Follow where followingId = ${webcardId})`,
            ),
          );
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
