export const isEditor = (profileRole: string) =>
  profileRole === 'editor' ||
  profileRole === 'admin' ||
  profileRole === 'owner';

export const isAdmin = (profileRole: string) =>
  profileRole === 'admin' || profileRole === 'owner';

export const isOwner = (profileRole: string) => profileRole === 'owner';
