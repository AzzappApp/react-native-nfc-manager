'use server';

import { eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  getUserById,
  updateUser,
  db,
  WebCardTable,
  ProfileTable,
  upsertSubscription,
} from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
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

export const setLifetimeSubscription = async (
  userId: string,
  active: boolean,
) => {
  await upsertSubscription({
    userId,
    subscriptionPlan: 'web.lifetime',
    subscriptionId: createId(),
    startAt: new Date(),
    endAt: new Date('2099-12-31'),
    issuer: 'web',
    totalSeats: 999999,
    status: active ? 'active' : 'canceled',
    canceledAt: active ? null : new Date(),
  });

  revalidatePath(`/users/${userId}`);
};

export const removeWebcard = async (webcardId: string) => {
  const session = await getSession();

  if (session?.userId) {
    await db.transaction(async trx => {
      await trx
        .update(WebCardTable)
        .set({
          deletedAt: new Date(),
          deletedBy: session.userId,
          deleted: true,
          cardIsPublished: false,
        })
        .where(eq(WebCardTable.id, webcardId));

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
        .update(ProfileTable)
        .set({
          deletedAt: new Date(),
          deletedBy: session.userId,
          deleted: true,
        })
        .where(eq(ProfileTable.webCardId, webcardId));
    });
    revalidatePath(`/users/${session.userId}`);
  }
};
