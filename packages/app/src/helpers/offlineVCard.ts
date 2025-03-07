import { useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { useFragment } from 'react-relay';
import OfflineVCardScreenProfilesFragment from '#relayArtifacts/OfflineVCardScreen_profiles.graphql';
import type {
  OfflineVCardScreen_profiles$data,
  OfflineVCardScreen_profiles$key,
} from '#relayArtifacts/OfflineVCardScreen_profiles.graphql';

/**
 * this module is used to manage Offline VCards
 */

export const storage = new MMKV();

const VCardDataKey = 'vcardData';

export const useSaveOfflineVCard = (
  profilesKey: OfflineVCardScreen_profiles$key | null | undefined,
) => {
  const profiles = useFragment(OfflineVCardScreenProfilesFragment, profilesKey);
  useEffect(() => {
    if (profiles) {
      storage.set(VCardDataKey, JSON.stringify(profiles));
    }
  }, [profiles]);
};

export const getOfflineVCard = (): OfflineVCardScreen_profiles$data => {
  const data = storage.getString(VCardDataKey);
  return data ? JSON.parse(data) : undefined;
};
