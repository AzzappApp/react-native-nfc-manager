import { useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { getAuthState } from '#helpers/authStore';

const RECENT_SEARCH_KEY = 'recentSearch';
const MAX_ITEM_COUNT = 20;

let recentSearchStore: MMKV | null = null;

const getRecentSearchStore = () => {
  const userId = getAuthState().profileInfos?.userId;
  if (!userId) {
    return null;
  }
  if (!recentSearchStore) {
    recentSearchStore = new MMKV({ id: `recentSearchStore_${userId}` });
  }
  return recentSearchStore;
};

/**
 * It gets the recent search from the AsyncStorage and returns it
 * @returns An array of objects.
 */
export const getRecentSearch = (): string[] => {
  const recentSearch = getRecentSearchStore()?.getString(RECENT_SEARCH_KEY);
  if (recentSearch) {
    return JSON.parse(recentSearch);
  }
  return [];
};

/**
 * Add and entry in search history. If already exist remove it and add it again in first position
 * @param {string} searchEntry - The string that you want to add to the recent search list.
 */
export const addRecentSearch = (searchEntry: string | null | undefined) => {
  if (isNotFalsyString(searchEntry)) {
    let recentSearch = getRecentSearch();
    if (recentSearch) {
      if (recentSearch.includes(searchEntry!)) {
        recentSearch.splice(recentSearch.indexOf(searchEntry!), 1);
      }
      recentSearch.unshift(searchEntry!);
      if (recentSearch.length > MAX_ITEM_COUNT) {
        recentSearch.pop();
      }
    } else {
      recentSearch = [searchEntry!];
    }
    getRecentSearchStore()?.set(
      RECENT_SEARCH_KEY,
      JSON.stringify(recentSearch),
    );
  }
};

/**
 * It deletes a search entry from the recent search list
 * @param {string} searchEntry - The search entry to be deleted.
 */
export const removeRecentSearch = (searchEntry: string) => {
  const recentSearch = getRecentSearch();
  if (recentSearch) {
    if (recentSearch.includes(searchEntry)) {
      recentSearch.splice(recentSearch.indexOf(searchEntry), 1);
      getRecentSearchStore()?.set(
        RECENT_SEARCH_KEY,
        JSON.stringify(recentSearch),
      );
    }
  }
};

/**
 * It removes the item with the key RECENT_SEARCH_KEY from AsyncStorage
 */
export const clearRecentSearch = () => {
  getRecentSearchStore()?.delete(RECENT_SEARCH_KEY);
};

export default function useRecentSearch() {
  const [recentSearch, setRecentSearch] = useState<string[]>(getRecentSearch());

  const addRecentSearchItem = (searchEntry: string | undefined) => {
    addRecentSearch(searchEntry);
    const res = getRecentSearch();
    setRecentSearch(res);
  };

  const removeRecentSearchItem = (searchEntry: string) => {
    removeRecentSearch(searchEntry);
    setRecentSearch(getRecentSearch());
    const res = getRecentSearch();
    setRecentSearch(res);
  };

  return { recentSearch, addRecentSearchItem, removeRecentSearchItem };
}
