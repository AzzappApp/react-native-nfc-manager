import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { BackHandler, Platform, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '#theme';
import { useRouter, useScreenHasFocus } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
import SearchBar from '#ui/SearchBar';
import RecentSearch from './RecentSearch';
import SearchTabContainer from './SearchTabContainer';
import useRecentSearch from './useRecentSearch';

export const SearchScreen = ({ hasFocus = true }: { hasFocus: boolean }) => {
  const intl = useIntl();
  const router = useRouter();
  const styles = useStyleSheet(styleSheet);

  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [searchValueSubmitted, setSearchValueSubmitted] = useState<
    string | undefined
  >(undefined);
  const [showTabView, setShowTabView] = useState(false);

  const [searchBarHasFocus, setSearchBarHasFocus, removeSearchBarHasFocus] =
    useBoolean(false);

  const onCancel = useCallback(() => {
    setShowTabView(false);
    removeSearchBarHasFocus();
  }, [removeSearchBarHasFocus]);

  // we are doing the type on value for the search recent, inside the recent search local storage
  const onChangeText = useCallback((text: string | undefined) => {
    setSearchValue(text);

    if (text == null) {
      setShowTabView(false);
    }
  }, []);

  // search hook logic is here in order to catch the onSubmitEnding for searchBar
  const { recentSearch, addRecentSearchItem, removeRecentSearchItem } =
    useRecentSearch();

  // searchOnSubmit button is used to trigger the search.  (can change to on typing text wiht debounce if needed)
  const onSubmittedSearch = useCallback(async () => {
    setShowTabView(true);
    const searchTrimmed = searchValue?.trim();
    setSearchValueSubmitted(searchTrimmed);
    addRecentSearchItem(searchTrimmed);
  }, [addRecentSearchItem, searchValue]);

  const onSearch = useCallback(async (search: string) => {
    setShowTabView(true);
    setSearchValue(search);
    const searchTrimmed = search?.trim();
    setSearchValueSubmitted(searchTrimmed);
  }, []);

  const insets = useScreenInsets();

  const showRecent = useAnimatedState(searchBarHasFocus, {
    duration: ANIMATION_DURATION,
  });

  const recentBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: showRecent.value,
    };
  });

  // #region backhandling

  // This part is (again a workaround). when leaving the search result we had a crash
  // hiding the "setShowTabView(false)" workaround the issue.
  // looks like linked: https://github.com/software-mansion/react-native-screens/issues/2461
  const isActive = useScreenHasFocus();
  const onBackRequested = useCallback(() => {
    if (isActive) {
      setShowTabView(false);
      setTimeout(router.back);
      return true;
    }
    return false;
  }, [isActive, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackRequested,
    );
    return () => backHandler.remove();
  }, [isActive, onBackRequested]);
  // #endregion

  // #region render
  return (
    <Container style={[styles.flexOne, { paddingTop: insets.top }]}>
      <View style={styles.searchBarContainer}>
        {!searchBarHasFocus && (
          <IconButton
            variant="icon"
            icon="arrow_left"
            onPress={onBackRequested}
            style={styles.backButton}
          />
        )}
        <View style={styles.flexOne}>
          <SearchBar
            placeholder={intl.formatMessage({
              defaultMessage: 'Search for WebCards, posts...',
              description: 'SearchScreen - search bar placeholder',
            })}
            onChangeText={onChangeText}
            onFocus={setSearchBarHasFocus}
            onBlur={removeSearchBarHasFocus}
            onCancel={onCancel}
            onSubmitEditing={onSubmittedSearch}
            animationDuration={ANIMATION_DURATION}
            value={searchValue}
            autoFocus
          />
        </View>
      </View>
      <View style={styles.flexOne}>
        {showTabView && (
          <SearchTabContainer
            searchValue={searchValueSubmitted}
            hasFocus={hasFocus}
          />
        )}
        <Animated.View
          style={[styles.viewTransitionRecent, recentBarAnimatedStyle]}
          pointerEvents={searchBarHasFocus ? 'auto' : 'none'}
          testID="azzaap_searchScreeb-RecentSearch_viewTransition"
        >
          <RecentSearch
            searchValue={searchValue}
            recentSearch={recentSearch}
            removeSearch={removeRecentSearchItem}
            search={onSearch}
          />
        </Animated.View>
      </View>
    </Container>
  );
};

export default SearchScreen;

const ANIMATION_DURATION = 300;
const styleSheet = createStyleSheet(appearance => ({
  viewTransitionRecent: {
    height: '100%',
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },

  wallViewTransition: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  flexOne: { flex: 1 },
  searchBarContainer: {
    paddingTop: Platform.OS === 'android' ? 5 : 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    width: '100%',
    columnGap: 5,
    alignItems: 'center',
  },
  backButton: { width: 34, height: 34 },
}));
