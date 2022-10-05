import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useEffect, useMemo, useState, useCallback } from 'react';

import { View, StyleSheet, Dimensions } from 'react-native';
import { usePaginationFragment, graphql, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '../../../theme';
import PostsGrid from '../../components/PostsGrid';
import SkeletonPlaceholder from '../../components/SkeletonPlaceholder';
import ListLoadingFooter from '../../ui/ListLoadingFooter';
import SearchResultGlobalListHeader, {
  SearchResultGlobalListHeaderPlaceholder,
} from './SearchResultGlobalListHeader';

import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { SearchResultGlobalPosts_viewer$key } from '@azzapp/relay/artifacts/SearchResultGlobalPosts_viewer.graphql';
import type { SearchResultGlobalQuery } from '@azzapp/relay/artifacts/SearchResultGlobalQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

export const searchResultGlobalQuery = graphql`
  query SearchResultGlobalQuery($search: String!, $useLocation: Boolean!) {
    viewer {
      ...SearchResultGlobalListHeader_viewer
        @arguments(search: $search, useLocation: $useLocation)
      ...SearchResultGlobalPosts_viewer
        @arguments(search: $search, useLocation: $useLocation)
    }
  }
`;

type Props = {
  queryReference: PreloadedQuery<SearchResultGlobalQuery>;
};

const SearchResultGlobal = ({ queryReference }: Props) => {
  const preloadedQuery = usePreloadedQuery<SearchResultGlobalQuery>(
    searchResultGlobalQuery,
    queryReference,
  );

  const { data, loadNext, isLoadingNext, hasNext, refetch } =
    usePaginationFragment<
      SearchResultGlobalQuery,
      SearchResultGlobalPosts_viewer$key
    >(
      graphql`
        fragment SearchResultGlobalPosts_viewer on Viewer
        @refetchable(queryName: "SearchGlobalPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
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
      preloadedQuery.viewer,
    );

  const posts: PostsGrid_posts$key = useMemo(() => {
    return convertToNonNullArray(
      data.searchPosts?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.searchPosts?.edges]);

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

  return (
    <PostsGrid
      posts={posts}
      canPlay={false}
      ListHeaderComponent={
        <SearchResultGlobalListHeader viewer={preloadedQuery.viewer} />
      }
      ListFooterComponent={
        <ListLoadingFooter loading={showLoadingIndicatorDebounced} />
      }
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      useWindowScroll
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
