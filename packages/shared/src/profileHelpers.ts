export const isEditor = (profileRole: string | null | undefined) =>
  profileRole === 'editor' ||
  profileRole === 'admin' ||
  profileRole === 'owner';

export const isAdmin = (profileRole: string | null | undefined) =>
  profileRole === 'admin' || profileRole === 'owner';

export const isOwner = (profileRole: string | null | undefined) =>
  profileRole === 'owner';
