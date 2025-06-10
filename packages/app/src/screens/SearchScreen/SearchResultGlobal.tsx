import { useEffect, useMemo, useState, useCallback } from 'react';

import { View, StyleSheet, Dimensions } from 'react-native';
import { usePaginationFragment, graphql, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import PostsGrid from '#components/PostList/PostsGrid';
import SkeletonPlaceholder from '#components/Skeleton';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import SearchResultGlobalListHeader, {
  SearchResultGlobalListHeaderFragment,
  SearchResultGlobalListHeaderPlaceholder,
} from './SearchResultGlobalListHeader';

import type { PostsGrid_posts$key } from '#relayArtifacts/PostsGrid_posts.graphql';
import type { SearchResultGlobalListHeader_profile$data } from '#relayArtifacts/SearchResultGlobalListHeader_profile.graphql';
import type { SearchResultGlobalPosts_profile$key } from '#relayArtifacts/SearchResultGlobalPosts_profile.graphql';
import type { SearchResultGlobalQuery } from '#relayArtifacts/SearchResultGlobalQuery.graphql';
import type { ViewStyle } from 'react-native';
import type { PreloadedQuery } from 'react-relay';

export const searchResultGlobalQuery = graphql`
  query SearchResultGlobalQuery(
    $profileId: ID!
    $search: String!
    $useLocation: Boolean!
  ) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...SearchResultGlobalListHeader_profile
          @arguments(search: $search, useLocation: $useLocation)
        ...SearchResultGlobalPosts_profile
          @arguments(search: $search, useLocation: $useLocation)
      }
    }
  }
`;

type SearchResultGlobalProps = {
  queryReference: PreloadedQuery<SearchResultGlobalQuery>;
  hasFocus: boolean;
  goToProfilesTab: () => void;
  renderNoResultComponent: (query: string) => JSX.Element;
};

const SearchResultGlobal = ({
  queryReference,
  hasFocus,
  goToProfilesTab,
  renderNoResultComponent,
}: SearchResultGlobalProps) => {
  const { node } = usePreloadedQuery<SearchResultGlobalQuery>(
    searchResultGlobalQuery,
    queryReference,
  );
  const profile = node?.profile;

  const { data, loadNext, isLoadingNext, hasNext, refetch } =
    usePaginationFragment<
      SearchResultGlobalQuery,
      SearchResultGlobalPosts_profile$key
    >(
      graphql`
        fragment SearchResultGlobalPosts_profile on Profile
        @refetchable(queryName: "SearchGlobalPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
          search: { type: "String!" }
          useLocation: { type: "Boolean!" }
        ) {
          searchPosts(
            after: $after
            first: $first
            search: $search
            useLocation: $useLocation
          ) @connection(key: "Viewer_searchPosts") {
            edges {
              node {
                ...PostsGrid_posts
              }
            }
          }
        }
      `,
      profile,
    );

  const posts: PostsGrid_posts$key = useMemo(() => {
    return convertToNonNullArray(
      data?.searchPosts?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data?.searchPosts?.edges]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    refetch(
      {},
      {
        // network-only cause flash of content
        fetchPolicy: 'store-and-network',
        onComplete() {
          //TODO handle errors
          setRefreshing(false);
        },
      },
    );
  }, [refetch, refreshing]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const [sowLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [showLoadingIndicatorDebounced] = useDebounce(sowLoadingIndicator, 150);
  useEffect(() => {
    setShowLoadingIndicator(!refreshing && isLoadingNext);
  }, [isLoadingNext, refreshing]);

  const ListFooterComponent = useMemo(
    () => <ListLoadingFooter loading={showLoadingIndicatorDebounced} />,
    [showLoadingIndicatorDebounced],
  );

  // header query is done here as we must know number of post to display the "no result" banner
  const { data: headerData } = usePaginationFragment(
    SearchResultGlobalListHeaderFragment,
    profile,
  );

  const nbWebCard =
    (headerData as SearchResultGlobalListHeader_profile$data)?.searchWebCards
      ?.edges?.length || 0;

  if ((nbWebCard === 0 && posts.length === 0) || !profile) {
    return renderNoResultComponent(queryReference.variables.search);
  }
  return (
    <PostsGrid
      posts={posts}
      canPlay={hasFocus}
      ListHeaderComponent={
        <SearchResultGlobalListHeader
          profile={profile}
          goToProfilesTab={goToProfilesTab}
        />
      }
      ListFooterComponent={ListFooterComponent}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
    />
  );
};
export default SearchResultGlobal;

export const SearchResultGlobalPlaceHolder = () => {
  return (
    <View>
      <SearchResultGlobalListHeaderPlaceholder />
      <View style={styles.placeHolderContainer}>
        <View style={styles.placeHolderHeaderContainer}>
          <SkeletonPlaceholder style={styles.placeHolder80} />
          <SkeletonPlaceholder style={styles.placeHolder210} />
          <SkeletonPlaceholder style={styles.placeHolder100} />
        </View>
        <View style={styles.placeHolderBodyContainer}>
          <SkeletonPlaceholder style={styles.placeHolder130} />
          <SkeletonPlaceholder style={styles.placeHolder75} />
          <SkeletonPlaceholder style={styles.placeHolder210} />
        </View>
      </View>
    </View>
  );
};
const { width } = Dimensions.get('window');

const WIDTH_POST = (width - 16) / 2;

const postPlaceHolder: ViewStyle = {
  width: '100%',
  marginBottom: 5,
  borderRadius: 16,
  backgroundColor: colors.grey50,
};

const styles = StyleSheet.create({
  placeHolderContainer: {
    marginLeft: 8,
    marginRight: 8,
    flexDirection: 'row',
  },
  placeHolderHeaderContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: WIDTH_POST,
    paddingRight: 5,
  },
  placeHolderBodyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: WIDTH_POST,
    paddingLeft: 5,
  },
  placeHolder80: {
    ...postPlaceHolder,
    height: 80,
  },
  placeHolder210: {
    ...postPlaceHolder,
    height: 210,
  },
  placeHolder100: {
    ...postPlaceHolder,
    height: 100,
  },
  placeHolder130: {
    ...postPlaceHolder,
    height: 130,
  },
  placeHolder75: {
    ...postPlaceHolder,
    height: 75,
  },
});
