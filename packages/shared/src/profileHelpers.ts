export const profileHasEditorRight = (profileRole: string | null | undefined) =>
  profileRole === 'editor' ||
  profileRole === 'admin' ||
  profileRole === 'owner';

export const profileHasAdminRight = (profileRole: string | null | undefined) =>
  profileRole === 'admin' || profileRole === 'owner';

export const profileIsOwner = (profileRole: string | null | undefined) =>
  profileRole === 'owner';
