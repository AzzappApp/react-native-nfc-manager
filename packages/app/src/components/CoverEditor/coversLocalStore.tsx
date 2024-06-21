import { pick } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { getAuthState } from '#helpers/authStore';
import type { CoverEditorState } from './coverEditorTypes';

let coverStore: MMKV | null = null;

export type CoverInfos = Pick<
  CoverEditorState,
  | 'backgroundColor'
  | 'coverId'
  | 'coverTransition'
  | 'linksLayer'
  | 'medias'
  | 'overlayLayers'
  | 'template'
  | 'template'
  | 'textLayers'
>;

const getCoverStore = () => {
  const userId = getAuthState().profileInfos?.userId;
  if (!userId) {
    return null;
  }
  if (!coverStore) {
    coverStore = new MMKV({ id: `coverStore_${userId}` });
  }
  return coverStore;
};

const getSavedCover = () => {
  const store = getCoverStore();
  if (!store) {
    return null;
  }
  const webCardId = getAuthState().profileInfos?.webCardId;
  if (!webCardId) {
    return null;
  }
  const storeString = store.getString(webCardId);
  if (!storeString) {
    return null;
  }
  try {
    return JSON.parse(storeString) as CoverInfos;
  } catch {
    return null;
  }
};

const saveCover = (state: CoverEditorState) => {
  const store = getCoverStore();
  if (!store) {
    return;
  }
  const webCardId = getAuthState().profileInfos?.webCardId;
  if (!webCardId) {
    return;
  }
  store.set(
    webCardId,
    JSON.stringify(
      pick(state, [
        'coverId',
        'backgroundColor',
        'coverTransition',
        'linksLayer',
        'medias',
        'overlayLayers',
        'template',
        'textLayers',
      ]),
    ),
  );
};

const coverLocalStore = {
  getSavedCover,
  saveCover,
};

export default coverLocalStore;
