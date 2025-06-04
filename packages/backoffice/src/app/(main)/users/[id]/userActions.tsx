'use server';

import * as Sentry from '@sentry/nextjs';
import { getVercelOidcToken } from '@vercel/functions/oidc';
import { revalidatePath } from 'next/cache';
import {
  getUserById,
  updateUser,
  markWebCardAsDeleted,
  getProfileByUserAndWebCard,
  transaction,
  updateProfile,
  getUserProfilesWithWebCard,
  markUserAsDeleted,
  markUserAsActive,
  getWebCardById,
  updateWebCard,
} from '@azzapp/data';
import { AZZAPP_SERVER_HEADER, buildWebUrl } from '@azzapp/shared/urlHelpers';
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

export const removeWebCard = async (userId: string, webcardId: string) => {
  const session = await getSession();

  const profile = await getProfileByUserAndWebCard(userId, webcardId);

  if (session?.userId && profile) {
    const updates = {
      deletedAt: new Date(),
      deletedBy: session.userId,
      deleted: true,
    };

    await transaction(async () => {
      if (profile.profileRole === 'owner') {
        await markWebCardAsDeleted(webcardId, userId);
      } else {
        await updateProfile(profile.id, updates);
      }
    });
    revalidatePath(`/users/${userId}`);
  }
};

export const toggleUserActive = async (userId: string) => {
  const user = await getUserById(userId);

  const session = await getSession();

  if (user && session?.userId) {
    const ownerProfiles = await getUserProfilesWithWebCard(userId).then(
      profiles =>
        profiles.filter(({ profile }) => profile.profileRole === 'owner'),
    );

    try {
      if (!user.deleted) {
        await markUserAsDeleted(userId, session.userId);
      } else {
        await markUserAsActive(userId);
      }

      const res = await fetch(buildWebUrl('/api/revalidate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
        },
        body: JSON.stringify({
          cards: ownerProfiles.map(({ webCard }) => webCard.userName),
          posts: [],
        }),
      });

      if (!res.ok) {
        throw new Error(res.statusText, { cause: res });
      }
    } catch (e) {
      Sentry.captureException(e);
    }
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

export const toggleStar = async (userId: string, webCardId: string) => {
  if (!(await currentUserHasRole(ADMIN))) {
    return null;
  }

  const webCard = await getWebCardById(webCardId);

  if (!webCard) {
    return null;
  }

  await updateWebCard(webCardId, {
    starred: !webCard.starred,
  });

  revalidatePath(`/users/${userId}`);
};
