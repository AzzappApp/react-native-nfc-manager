import { useState, useEffect, Suspense, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { loadQuery, useRelayEnvironment } from 'react-relay';
import { colors } from '../../theme';
import Icon from '../../ui/Icon';
import SearchResultGlobal, {
  SearchResultGlobalPlaceHolder,
  searchResultGlobalQuery,
} from './SearchResultGlobal';
import SearchResultPosts, {
  SearchResultPostsPlaceHolder,
  searchResultPostsQuery,
} from './SearchResultPosts';
import SearchResultProfiles, {
  SearchResultProfilesPlaceHolder,
  searchResultProfilesQuery,
} from './SearchResultProfiles';
import type { Icons } from '../../ui/Icon';
import type { SearchResultGlobalQuery } from '@azzapp/relay/artifacts/SearchResultGlobalQuery.graphql';
import type { SearchResultPostsQuery } from '@azzapp/relay/artifacts/SearchResultPostsQuery.graphql';
import type { SearchResultProfilesQuery } from '@azzapp/relay/artifacts/SearchResultProfilesQuery.graphql';
import type {
  NavigationState,
  SceneRendererProps,
} from 'react-native-tab-view';
import type { PreloadedQuery } from 'react-relay';

type SearchTabContainerProps = {
  searchValue: string | undefined;
  hasFocus: boolean;
};

const SearchTabContainer = ({
  searchValue,
  hasFocus,
}: SearchTabContainerProps) => {
  const [tabQueryReference, setTabPreloadedQuery] = useState<TabQueries>({
    searchGlobal: undefined,
    searchProfiles: undefined,
    searchPosts: undefined,
    searchGlobalhWithLocation: undefined,
  });
  const [pageIndexSelected, setPageindexSelected] = useState(0);
  const environnement = useRelayEnvironment();

  useEffect(() => {
    if (searchValue && environnement) {
      const queryReference = loadQuery(
        environnement,
        routes[pageIndexSelected].query,
        { search: searchValue, useLocation: pageIndexSelected === 3 },
        { fetchPolicy: 'store-or-network' },
      );
      setTabPreloadedQuery(prevState => {
        return {
          ...prevState,
          [routes[pageIndexSelected].key]: queryReference,
        };
      });
    }
  }, [environnement, pageIndexSelected, searchValue]);

  //TODO: inquiry this because warning are shown that query are disposed and should not
  useEffect(() => {
    return () => {
      Object.values(tabQueryReference).forEach(queryReference => {
        queryReference?.dispose();
      });
    };
  }, [tabQueryReference]);

  const onIndexTabChange = (index: number) => {
    setPageindexSelected(index);
  };

  const renderScene = useCallback(
    ({
      route,
    }: SceneRendererProps & {
      route: {
        key: string;
      };
    }) => {
      // TODO hasFocus should be true only on the current tab
      switch (route.key) {
        case 'searchGlobal':
          return (
            <Suspense fallback={<SearchResultGlobalPlaceHolder />}>
              {tabQueryReference['searchGlobal'] && (
                <SearchResultGlobal
                  queryReference={tabQueryReference['searchGlobal']}
                  hasFocus={hasFocus}
                />
              )}
            </Suspense>
          );
        case 'searchProfiles':
          return (
            <Suspense fallback={<SearchResultProfilesPlaceHolder />}>
              {tabQueryReference['searchProfiles'] && (
                <SearchResultProfiles
                  queryReference={tabQueryReference['searchProfiles']}
                />
              )}
            </Suspense>
          );
        case 'searchPosts':
          return (
            <Suspense fallback={<SearchResultPostsPlaceHolder />}>
              {tabQueryReference['searchPosts'] && (
                <SearchResultPosts
                  queryReference={tabQueryReference['searchPosts']}
                  hasFocus={hasFocus}
                />
              )}
            </Suspense>
          );
        case 'searchGlobalhWithLocation':
          return (
            <Suspense fallback={<SearchResultGlobalPlaceHolder />}>
              {tabQueryReference['searchGlobalhWithLocation'] && (
                <SearchResultGlobal
                  queryReference={
                    tabQueryReference['searchGlobalhWithLocation']
                  }
                  hasFocus={hasFocus}
                />
              )}
            </Suspense>
          );
      }
    },
    [hasFocus, tabQueryReference],
  );
  return (
    <TabView
      navigationState={{ index: pageIndexSelected, routes }}
      renderTabBar={renderTabBar}
      renderScene={renderScene}
      onIndexChange={onIndexTabChange}
      style={styles.tabViewstyle}
    />
  );
};

export default SearchTabContainer;

const renderTabBar = (
  props: SceneRendererProps & {
    navigationState: NavigationState<{
      key: string;
      icon: string;
    }>;
  },
) => {
  return (
    <TabBar
      {...props}
      style={styles.tabBarStyle}
      indicatorStyle={{
        backgroundColor: colors.black,
        height: 2,
        borderRadius: 4,
        marginLeft: 9,
        marginRight: 9,
        width: props.layout.width / 4 - 18,
      }}
      labelStyle={{ color: colors.black }}
      inactiveColor={colors.grey50}
      activeColor={colors.black}
      renderLabel={({ route, color }) => (
        <Icon
          icon={route.icon as Icons}
          style={[styles.image, { tintColor: color }]}
        />
      )}
    />
  );
};

const routes = [
  { key: 'searchGlobal', icon: 'foursquare', query: searchResultGlobalQuery },
  {
    key: 'searchProfiles',
    icon: 'searchprofile',
    query: searchResultProfilesQuery,
  },
  { key: 'searchPosts', icon: 'hashtag', query: searchResultPostsQuery },
  {
    key: 'searchGlobalhWithLocation',
    icon: 'location',
    query: searchResultGlobalQuery,
  },
];

type TabQueries = {
  searchGlobal: PreloadedQuery<SearchResultGlobalQuery> | undefined;
  searchProfiles: PreloadedQuery<SearchResultProfilesQuery> | undefined;
  searchPosts: PreloadedQuery<SearchResultPostsQuery> | undefined;
  searchGlobalhWithLocation:
    | PreloadedQuery<SearchResultGlobalQuery>
    | undefined;
};

const IMAGE_SIZE = 24;
const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: 'white',
    color: colors.black,
    shadowOffset: { height: 0, width: 0 },
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  tabViewstyle: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    tintColor: colors.grey50,
  },
  imageActive: {
    tintColor: colors.black,
  },
});
