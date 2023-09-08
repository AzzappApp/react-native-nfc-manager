import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '#components/NativeRouter';
import useAnimatedState from '#hooks/useAnimatedState';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
import SearchBar from '#ui/SearchBar';
import RecentSearch from './RecentSearch';
import SearchTabContainer from './SearchTabContainer';
import useRecentSearch from './useRecentSearch';

export const SearchScreen = ({ hasFocus = true }: { hasFocus: boolean }) => {
  const intl = useIntl();

  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [searchValueSubmitted, setSearchValueSubmitted] = useState<
    string | undefined
  >(undefined);
  const [showTabView, setShowTabView] = useState(false);
  const [searchBarHasFocus, setSearchBarHasFocus] = useState(false);

  const onFocus = () => setSearchBarHasFocus(true);
  const onBlur = () => setSearchBarHasFocus(false);
  const onCancel = () => {
    setShowTabView(false);
    setSearchBarHasFocus(false);
  };

  // we are doing the type on value for the search recent, inside the recent search local storage
  const onChangeText = (text: string | undefined) => {
    setSearchValue(text);

    if (text == null) {
      setShowTabView(false);
    }
  };

  // search hook logic is here in order to catch the onSubmitEnding for searchBar
  const { recentSearch, addRecentSearchItem, removeRecentSearchItem } =
    useRecentSearch();

  // searchOnSubmit button is used to trigger the search.  (can change to on typing text wiht debounce if needed)
  const onSubmittedSearch = async (search: string | undefined) => {
    setShowTabView(true);

    setSearchValueSubmitted(search);
    await addRecentSearchItem(search);
    if (search !== searchValue) {
      // used in case the search value is press on recent search
      setSearchValue(search);
    }
  };

  const insets = useSafeAreaInsets();

  const timer = useAnimatedState(searchBarHasFocus, {
    duration: ANIMATION_DURATION,
  });

  const recentBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: timer.value,
    };
  }, [timer]);

  const router = useRouter();

  return (
    <Container style={[styles.flexOne, { paddingTop: insets.top }]}>
      <View style={styles.searchBarContainer}>
        {!searchBarHasFocus && (
          <IconButton
            variant="icon"
            icon="arrow_left"
            onPress={router.back}
            style={styles.backButton}
          />
        )}
        <View style={{ flex: 1 }}>
          <SearchBar
            placeholder={intl.formatMessage({
              defaultMessage: 'Search for profiles, posts...',
              description: 'SearchScreen - search bar placeholder',
            })}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            onCancel={onCancel}
            onSubmitEditing={onSubmittedSearch}
            animationDuration={ANIMATION_DURATION}
            value={searchValue}
            autoFocus
          />
        </View>
      </View>
      <View style={styles.flexOne}>
        <Animated.View
          style={[styles.viewTransitionRecent, recentBarAnimatedStyle]}
          pointerEvents={searchBarHasFocus ? 'auto' : 'none'}
          testID="azzaap_searchScreeb-RecentSearch_viewTransition"
        >
          <RecentSearch
            searchValue={searchValue}
            recentSearch={recentSearch}
            removeSearch={removeRecentSearchItem}
            search={onSubmittedSearch}
          />
        </Animated.View>
        {showTabView && (
          <SearchTabContainer
            searchValue={searchValueSubmitted}
            hasFocus={hasFocus}
          />
        )}
      </View>
    </Container>
  );
};

export default SearchScreen;

const ANIMATION_DURATION = 300;
const styles = StyleSheet.create({
  viewTransitionRecent: {
    height: '100%',
    width: '100%',
  },

  wallViewTransition: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },

  flexOne: { flex: 1 },
  searchBarContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    width: '100%',
    columnGap: 5,
    alignItems: 'center',
  },
  backButton: { width: 34, height: 34 },
});
