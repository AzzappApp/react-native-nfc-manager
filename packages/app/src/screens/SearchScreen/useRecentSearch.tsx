import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';

const RECENT_SEARCH_KEY = 'recentSearch';
const MAX_ITEM_COUNT = 20;

/**
 * It gets the recent search from the AsyncStorage and returns it
 * @returns An array of objects.
 */
export const getRecentSearch = async (): Promise<string[]> => {
  const recentSearch = await AsyncStorage.getItem(RECENT_SEARCH_KEY);
  if (recentSearch) {
    return JSON.parse(recentSearch);
  }
  return [];
};

/**
 * Add and entry in search history. If already exist remove it and add it again in first position
 * @param {string} searchEntry - The string that you want to add to the recent search list.
 */
export const addRecentSearch = async (
  searchEntry: string | null | undefined,
) => {
  if (isNotFalsyString(searchEntry)) {
    let recentSearch = await getRecentSearch();
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
    await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recentSearch));
  }
};

/**
 * It deletes a search entry from the recent search list
 * @param {string} searchEntry - The search entry to be deleted.
 */
export const removeRecentSearch = async (searchEntry: string) => {
  const recentSearch = await getRecentSearch();
  if (recentSearch) {
    if (recentSearch.includes(searchEntry)) {
      recentSearch.splice(recentSearch.indexOf(searchEntry), 1);
      await AsyncStorage.setItem(
        RECENT_SEARCH_KEY,
        JSON.stringify(recentSearch),
      );
    }
  }
};

/**
 * It removes the item with the key RECENT_SEARCH_KEY from AsyncStorage
 */
export const clearRecentSearch = async () => {
  await AsyncStorage.removeItem(RECENT_SEARCH_KEY);
};

export default function useRecentSearch() {
  const [recentSearch, setRecentSearch] = useState<string[]>([]);

  useEffect(() => {
    getRecentSearch()
      .then(searchs => {
        setRecentSearch(searchs);
      })
      .catch(() => null);
  }, []);

  const addRecentSearchItem = async (searchEntry: string | undefined) => {
    await addRecentSearch(searchEntry);
    const res = await getRecentSearch();
    setRecentSearch(res);
  };

  const removeRecentSearchItem = async (searchEntry: string) => {
    await removeRecentSearch(searchEntry);
    setRecentSearch(await getRecentSearch());
    const res = await getRecentSearch();
    setRecentSearch(res);
  };

  return { recentSearch, addRecentSearchItem, removeRecentSearchItem };
}
