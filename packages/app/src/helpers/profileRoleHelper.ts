import {
  profileHasAdminRight,
  profileHasEditorRight,
  profileIsOwner,
} from '@azzapp/shared/profileHelpers';
import type { ProfileInfos } from './authStore';

type PartialProfileInfo = Pick<ProfileInfos, 'invited' | 'profileRole'>;

export const profileInfoHasEditorRight = (
  profileInfo: PartialProfileInfo | null | undefined,
) =>
  !!(
    profileInfo &&
    !profileInfo.invited &&
    profileHasEditorRight(profileInfo.profileRole)
  );

export const profileInfoHasAdminRight = (
  profileInfo: PartialProfileInfo | null | undefined,
) =>
  !!(
    profileInfo &&
    !profileInfo.invited &&
    profileHasAdminRight(profileInfo.profileRole)
  );

// No need to check invited flag in profileInfoIsOwner
// These flags are incompatible
export const profileInfoIsOwner = (
  profileInfo: Pick<ProfileInfos, 'profileRole'> | null | undefined,
) => !!(profileInfo && profileIsOwner(profileInfo.profileRole));
