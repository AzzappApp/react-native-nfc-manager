import getCurrentUser from './getCurrentUser';

export const currentUserHasRole = async (role: string) => {
  const user = await getCurrentUser();
  return user?.roles?.includes(role);
};
