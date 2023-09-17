import { cache } from 'react';
import { getUserById, type User } from '@azzapp/data/domains';
import { getSession } from '#helpers/session';

const getCurrentUser = cache(async () => {
  const session = await getSession();

  let user: User | null = null;
  if (session?.userId) {
    user = await getUserById(session.userId);
  }
  return user;
});

export default getCurrentUser;
