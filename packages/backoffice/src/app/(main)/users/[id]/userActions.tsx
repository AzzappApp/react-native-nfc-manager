'use server';

import { revalidatePath } from 'next/cache';
import { getUserById, updateUser } from '@azzapp/data/domains';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';

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

  revalidatePath('/users/[id]');
};
