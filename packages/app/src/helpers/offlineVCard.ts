import { MMKV } from 'react-native-mmkv';
import type { HomeScreenContext_user$data } from '#relayArtifacts/HomeScreenContext_user.graphql';

/**
 * this module is used to manage Offline VCards
 */

export const storage = new MMKV();

const VCardDataKey = 'vcardData';

export const saveOfflineVCard = async (data: HomeScreenContext_user$data) => {
  const profiles: string = JSON.stringify(data);
  storage.set(VCardDataKey, profiles);
};

export const getOfflineVCard = (): HomeScreenContext_user$data => {
  const data = storage.getString(VCardDataKey);
  return data ? JSON.parse(data) : undefined;
};
