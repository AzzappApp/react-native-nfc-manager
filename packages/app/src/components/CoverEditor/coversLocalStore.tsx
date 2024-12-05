import omit from 'lodash/omit';
import pick from 'lodash/pick';
import { MMKV } from 'react-native-mmkv';
import { getAuthState } from '#helpers/authStore';
import type { CoverEditorState } from './coverEditorTypes';

let coverStore: MMKV | null = null;

const COVER_STORE_VERSION = 2;

const SAVED_COVER_FIELDS = [
  'backgroundColor',
  'coverId',
  'coverPreviewPositionPercentage',
  'coverTransition',
  'linksLayer',
  'localPaths',
  'lottie',
  'medias',
  'overlayLayers',
  'textLayers',
] as const;

export type CoverInfos = Pick<
  CoverEditorState,
  (typeof SAVED_COVER_FIELDS)[number]
> & {
  version?: number;
};

const getCoverStore = () => {
  const userId = getAuthState().profileInfos?.userId;
  if (!userId) {
    return null;
  }
  if (!coverStore || coverStore.getString('userId') !== userId) {
    coverStore = new MMKV({ id: `coverStore_${userId}` });
    coverStore.set('userId', userId);
  }
  return coverStore;
};

const getSavedCover = (webCardId: string) => {
  const store = getCoverStore();
  if (!store) {
    return null;
  }

  const storeString = store.getString(webCardId);

  if (!storeString) {
    return null;
  }
  let state: CoverInfos;
  try {
    state = JSON.parse(storeString) as CoverInfos;
  } catch {
    return null;
  }
  if (state.version !== COVER_STORE_VERSION) {
    store.delete(webCardId);
    return null;
  }
  return omit(state, 'version');
};

const saveCover = (webCardId: string, state: CoverEditorState) => {
  const store = getCoverStore();
  if (!store) {
    return;
  }
  if (!webCardId) {
    return;
  }
  store.set(
    webCardId,
    JSON.stringify({
      ...pick(state, SAVED_COVER_FIELDS),
      version: COVER_STORE_VERSION,
    }),
  );
};

const coverLocalStore = {
  getSavedCover,
  saveCover,
};

export default coverLocalStore;
