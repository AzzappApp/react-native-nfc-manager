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

const offlineVCardStorage = new MMKV();

const VCardDataKey = 'vcardData';

export const cleanOfflineVCardData = () => {
  offlineVCardStorage.delete(VCardDataKey);
};

export const useSaveOfflineVCard = (
  profilesKey: OfflineVCardScreen_profiles$key | null | undefined,
  isPremium?: boolean | null,
) => {
  const profiles = useFragment(OfflineVCardScreenProfilesFragment, profilesKey);
  useEffect(() => {
    if (profiles) {
      offlineVCardStorage.set(
        VCardDataKey,
        JSON.stringify({ isPremium, profiles }),
      );
    }
  }, [isPremium, profiles]);
};

export const getOfflineVCard = ():
  | {
      isPremium: boolean | undefined;
      profiles: OfflineVCardScreen_profiles$data;
    }
  | undefined => {
  const data = offlineVCardStorage.getString(VCardDataKey);
  return data ? JSON.parse(data) : undefined;
};
