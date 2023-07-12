import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import useAnimatedState from '#hooks/useAnimatedState';
import Container from '#ui/Container';
import SearchBar from '#ui/SearchBar';
import RecentSearch from './RecentSearch';
import SearchTabContainer from './SearchTabContainer';
import useRecentSearch from './useRecentSearch';
import WallRecommendation from './WallRecommendation';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { SearchRoute } from '#routes';
import type { SearchScreenQuery } from '@azzapp/relay/artifacts/SearchScreenQuery.graphql';

const searchScreenQuery = graphql`
  query SearchScreenQuery {
    viewer {
      ...TrendingProfilesList_viewer
      ...TrendingPostsList_viewer
      ...RecommendedProfilesList_viewer
    }
  }
`;

export const SearchScreen = ({
  preloadedQuery,
  hasFocus = true,
}: RelayScreenProps<SearchRoute, SearchScreenQuery>) => {
  const { viewer } = usePreloadedQuery(searchScreenQuery, preloadedQuery);

  const intl = useIntl();

  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [searchValueSubmitted, setSearchValueSubmitted] = useState<
    string | undefined
  >(undefined);
  const [showTabView, setShowTabView] = useState(false);
  const [showWall, setShowWall] = useState(true);
  const [searchBarHasFocus, setSearchBarHasFocus] = useState(false);

  const onFocus = () => setSearchBarHasFocus(true);
  const onBlur = () => setSearchBarHasFocus(false);
  const onCancel = () => {
    setShowWall(true);
    setShowTabView(false);
    setSearchBarHasFocus(false);
  };

  // we are doing the type on value for the search recent, inside the recent search local storage
  const onChangeText = (text: string | undefined) => {
    setSearchValue(text);
    setShowWall(false);
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
    setShowWall(false);
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

  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(timer.value, [0, 1], [1, 0]),
    };
  }, [timer]);

  const recentBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: timer.value,
    };
  }, [timer]);

  return (
    <Container style={[styles.flexOne, { paddingTop: insets.top }]}>
      <SearchBar
        placeholder={intl.formatMessage({
          defaultMessage: 'Search for profiles, posts...',
          description: 'SearchScreen - search bar placeholder',
        })}
        containerStyle={styles.searchBarContainer}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        onCancel={onCancel}
        onSubmitEditing={onSubmittedSearch}
        animationDuration={ANIMATION_DURATION}
        value={searchValue}
      />
      <View style={styles.flexOne}>
        {showWall && (
          <Animated.View
            style={[styles.wallViewTransition, searchBarAnimatedStyle]}
          >
            <WallRecommendation viewer={viewer} hasFocus={hasFocus} />
          </Animated.View>
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

export default relayScreen(SearchScreen, {
  query: searchScreenQuery,
});

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
  },
});
