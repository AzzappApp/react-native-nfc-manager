import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { TabBar, TabView } from 'react-native-tab-view';
import { loadQuery, useRelayEnvironment } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAuthState from '#hooks/useAuthState';
import TabBarMenuItem from '#ui/TabBarMenuItem';
import Text from '#ui/Text';
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
import type { SearchResultGlobalQuery } from '#relayArtifacts/SearchResultGlobalQuery.graphql';
import type { SearchResultPostsQuery } from '#relayArtifacts/SearchResultPostsQuery.graphql';
import type { SearchResultProfilesQuery } from '#relayArtifacts/SearchResultProfilesQuery.graphql';
import type { ReactNode } from 'react';
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
  });
  const [pageIndexSelected, setPageindexSelected] = useState(0);
  const environnement = useRelayEnvironment();
  const styles = useStyleSheet(styleSheet);

  const intl = useIntl();
  const routes = useMemo(
    () => [
      {
        key: 'searchGlobal',
        label: intl.formatMessage({
          defaultMessage: 'All results',
          description: 'Search screen tab label : all result',
        }),
        query: searchResultGlobalQuery,
      },
      {
        key: 'searchProfiles',
        label: intl.formatMessage(
          {
            defaultMessage: 'Webcards{azzappA}',
            description: 'Search screen tab label : webcard',
          },
          { azzappA: <Text variant="azzapp">a</Text> },
        ),
        query: searchResultProfilesQuery,
      },
      {
        key: 'searchPosts',
        label: intl.formatMessage({
          defaultMessage: 'Posts',
          description: 'Search screen tab label : post',
        }),
        query: searchResultPostsQuery,
      },
    ],
    [intl],
  );
  const { profileInfos } = useAuthState();
  useEffect(() => {
    if (searchValue && environnement) {
      const queryReference = loadQuery(
        environnement,
        routes[pageIndexSelected].query,
        {
          search: searchValue,
          useLocation: false,
          profileId: profileInfos?.profileId,
        },
        { fetchPolicy: 'store-or-network' },
      );
      setTabPreloadedQuery(prevState => {
        return {
          ...prevState,
          [routes[pageIndexSelected].key]: queryReference,
        };
      });
    }
  }, [
    environnement,
    pageIndexSelected,
    profileInfos?.profileId,
    routes,
    searchValue,
  ]);

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
      jumpTo,
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
                  goToProfilesTab={() => jumpTo('searchProfiles')}
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
      }
    },
    [hasFocus, tabQueryReference],
  );
  return (
    <TabView
      navigationState={{ index: pageIndexSelected, routes }}
      renderTabBar={TabBarSearch}
      renderScene={renderScene}
      onIndexChange={onIndexTabChange}
      style={styles.tabViewstyle}
    />
  );
};

export default SearchTabContainer;

const TabBarSearch = (
  props: SceneRendererProps & {
    navigationState: NavigationState<{
      key: string;
      label: ReactNode;
    }>;
  },
) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <TabBar
      {...props}
      style={styles.tabBarStyle}
      renderIndicator={() => null}
      contentContainerStyle={{
        gap: 10,
        paddingLeft: 10,
      }}
      renderTabBarItem={({ route, labelStyle, renderLabel, onPress }) => {
        return (
          <TabBarMenuItem
            selected={
              props.navigationState.routes[props.navigationState.index].key ===
              route.key
            }
            onPress={onPress}
            labelStyle={labelStyle}
            style={styles.tabItemContainerStyle}
          >
            {renderLabel?.({
              route,
              focused:
                props.navigationState.routes[props.navigationState.index]
                  .key === route.key,
              color: colors.black,
            })}
          </TabBarMenuItem>
        );
      }}
      renderLabel={({ route }) =>
        typeof route.label === 'string' ? (
          <Text>{route.label}</Text>
        ) : (
          route.label
        )
      }
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  tabBarStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    shadowOpacity: 0,
    height: 52,
    justifyContent: 'center',
  },
  tabViewstyle: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    borderColor: 'red',
  },
  tabItemContainerStyle: {
    borderWidth: 1,
    borderColor: colors.grey50,
    padding: 0,
    minWidth: 109,
  },
}));

type TabQueries = {
  searchGlobal: PreloadedQuery<SearchResultGlobalQuery> | undefined;
  searchProfiles: PreloadedQuery<SearchResultProfilesQuery> | undefined;
  searchPosts: PreloadedQuery<SearchResultPostsQuery> | undefined;
};
