// test for RecentSearchHelper

import {
  getRecentSearch,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearch,
} from '../useRecentSearch';

jest.mock('#helpers/authStore', () => ({
  getAuthState: jest.fn(() => ({
    profileInfos: { userId: 'testUserId' },
  })),
}));

describe('RecentSearchHelper', () => {
  beforeEach(async () => {
    clearRecentSearch();
  });

  test('`getRecentSearch` should return empty array when no recent searches', async () => {
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  test('`addRecentSearch` should add recent search', async () => {
    addRecentSearch('test');
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual(['test']);
  });

  test('`addRecentSearch` should not add duplicate recent search', async () => {
    addRecentSearch('test');
    addRecentSearch('test');
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual(['test']);
  });

  test('`addRecentSearch` should not add recent search when empty', async () => {
    addRecentSearch('');
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  test('`removeRecentSearch` should remove recent search', async () => {
    addRecentSearch('test');
    removeRecentSearch('test');
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  test('`removeRecentSearch` should not remove recent search when empty', async () => {
    addRecentSearch('test');
    removeRecentSearch('');
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual(['test']);
  });

  test('`clearRecentSearch` should remove all recent searches', async () => {
    addRecentSearch('test');
    clearRecentSearch();
    const recentSearches = getRecentSearch();
    expect(recentSearches).toEqual([]);
  });

  //TODO: test the hook useRecentSearch
});
