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
  SearchResultGlobalListHeaderPlaceholder,
} from './SearchResultGlobalListHeader';

import type { PostsGrid_posts$key } from '#relayArtifacts/PostsGrid_posts.graphql';
import type { SearchResultGlobalPosts_profile$key } from '#relayArtifacts/SearchResultGlobalPosts_profile.graphql';
import type { SearchResultGlobalQuery } from '#relayArtifacts/SearchResultGlobalQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

export const searchResultGlobalQuery = graphql`
  query SearchResultGlobalQuery(
    $profileId: ID!
    $search: String!
    $useLocation: Boolean!
  ) {
    profile: node(id: $profileId) {
      ...SearchResultGlobalListHeader_profile
        @arguments(search: $search, useLocation: $useLocation)
      ...SearchResultGlobalPosts_profile
        @arguments(search: $search, useLocation: $useLocation)
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
  const { profile } = usePreloadedQuery<SearchResultGlobalQuery>(
    searchResultGlobalQuery,
    queryReference,
  );

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
                id
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

  if (!profile) {
    return null;
  }
  if (posts.length === 0) {
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
      <View
        style={{
          marginLeft: 8,
          marginRight: 8,
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: WIDTH_POST,
            paddingRight: 5,
          }}
        >
          <SkeletonPlaceholder
            style={[styles.postPlaceHolder, { height: 80 }]}
          />
          <SkeletonPlaceholder
            style={[styles.postPlaceHolder, { height: 210 }]}
          />
          <SkeletonPlaceholder
            style={[styles.postPlaceHolder, { height: 100 }]}
          />
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: WIDTH_POST,
            paddingLeft: 5,
          }}
        >
          <SkeletonPlaceholder
            style={[styles.postPlaceHolder, { height: 130 }]}
          />
          <SkeletonPlaceholder
            style={[styles.postPlaceHolder, { height: 75 }]}
          />
          <SkeletonPlaceholder
            style={[styles.postPlaceHolder, { height: 210 }]}
          />
        </View>
      </View>
    </View>
  );
};
const { width } = Dimensions.get('window');

const WIDTH_POST = (width - 16) / 2;
const styles = StyleSheet.create({
  postPlaceHolder: {
    width: '100%',
    marginBottom: 5,
    borderRadius: 16,
    backgroundColor: colors.grey50,
  },
});
