import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import useViewportSize, { insetTop } from '#hooks/useViewportSize';
import Container from '#ui/Container';
import SearchBar from '#ui/SearchBar';
import ViewTransition from '#ui/ViewTransition';
import RecentSearch from './RecentSearch';
import SearchTabContainer from './SearchTabContainer';
import useRecentSearch from './useRecentSearch';
import WallRecommendation from './WallRecommendation';
import type { SearchScreen_viewer$key } from '@azzapp/relay/artifacts/SearchScreen_viewer.graphql';

type SearchScreenProps = {
  viewer: SearchScreen_viewer$key;
  hasFocus?: boolean;
};

const SearchScreen = ({
  viewer: viewerRef,
  hasFocus = true,
}: SearchScreenProps) => {
  const viewer = useFragment(
    graphql`
      fragment SearchScreen_viewer on Viewer {
        ...TrendingProfilesList_viewer
        ...TrendingPostsList_viewer
        ...RecommendedProfilesList_viewer
      }
    `,
    viewerRef,
  );

  const vp = useViewportSize();
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

  return (
    <Container
      style={[
        styles.flexOne,
        {
          paddingTop: vp`${insetTop}`,
        },
      ]}
    >
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
          <ViewTransition
            transitionDuration={ANIMATION_DURATION}
            transitions={['opacity']}
            style={[
              styles.wallViewTransition,
              {
                opacity: searchBarHasFocus ? 0 : 1,
              },
            ]}
          >
            <WallRecommendation viewer={viewer} hasFocus={hasFocus} />
          </ViewTransition>
        )}
        <ViewTransition
          transitionDuration={ANIMATION_DURATION}
          transitions={['opacity']}
          style={[
            styles.viewTransitionRecent,
            { opacity: searchBarHasFocus ? 1 : 0 },
          ]}
          pointerEvents={searchBarHasFocus ? 'auto' : 'none'}
          testID="azzaap_searchScreeb-RecentSearch_viewTransition"
        >
          <RecentSearch
            searchValue={searchValue}
            recentSearch={recentSearch}
            removeSearch={removeRecentSearchItem}
            search={onSubmittedSearch}
          />
        </ViewTransition>
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
  },
});
