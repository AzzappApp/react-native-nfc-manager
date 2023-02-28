// test for RecentSearchHelper

import {
  getRecentSearch,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearch,
} from '../useRecentSearch';

describe('RecentSearchHelper', () => {
  beforeEach(async () => {
    await clearRecentSearch();
  });

  test('`getRecentSearch` should return empty array when no recent searches', async () => {
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  test('`addRecentSearch` should add recent search', async () => {
    await addRecentSearch('test');
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual(['test']);
  });

  test('`addRecentSearch` should not add duplicate recent search', async () => {
    await addRecentSearch('test');
    await addRecentSearch('test');
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual(['test']);
  });

  test('`addRecentSearch` should not add recent search when empty', async () => {
    await addRecentSearch('');
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  test('`removeRecentSearch` should remove recent search', async () => {
    await addRecentSearch('test');
    await removeRecentSearch('test');
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  test('`removeRecentSearch` should not remove recent search when empty', async () => {
    await addRecentSearch('test');
    await removeRecentSearch('');
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual(['test']);
  });

  test('`clearRecentSearch` should remove all recent searches', async () => {
    await addRecentSearch('test');
    await clearRecentSearch();
    const recentSearches = await getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  //TODO: test the hook useRecentSearch
});
