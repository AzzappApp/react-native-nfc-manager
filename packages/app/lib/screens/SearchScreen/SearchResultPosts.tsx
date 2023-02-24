import { useEffect, useCallback, useMemo, useState } from 'react';

import { Dimensions, View, StyleSheet } from 'react-native';
import { graphql, usePaginationFragment, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import PostsGrid from '../../components/PostsGrid';
import SkeletonPlaceholder from '../../components/SkeletonPlaceholder';
import { colors } from '../../theme';
import ListLoadingFooter from '../../ui/ListLoadingFooter';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { SearchResultPosts_viewer$key } from '@azzapp/relay/artifacts/SearchResultPosts_viewer.graphql';
import type { SearchResultPostsQuery } from '@azzapp/relay/artifacts/SearchResultPostsQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

export const searchResultPostsQuery = graphql`
  query SearchResultPostsQuery($search: String!) {
    viewer {
      ...SearchResultPosts_viewer @arguments(search: $search)
    }
  }
`;

type SearchResultPostsProps = {
  queryReference: PreloadedQuery<any>;
  hasFocus: boolean;
};

const SearchResultPosts = ({
  queryReference,
  hasFocus,
}: SearchResultPostsProps) => {
  const preloadedQuery = usePreloadedQuery<SearchResultPostsQuery>(
    searchResultPostsQuery,
    queryReference,
  );
  const { data, loadNext, isLoadingNext, hasNext, refetch } =
    usePaginationFragment<SearchResultPostsQuery, SearchResultPosts_viewer$key>(
      graphql`
        fragment SearchResultPosts_viewer on Viewer
        @refetchable(queryName: "SearchResultPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
          search: { type: "String!" }
        ) {
          searchPosts(
            after: $after
            first: $first
            search: $search
            useLocation: false
          ) @connection(key: "Viewer_searchPosts") {
            edges {
              node {
                ...PostsGrid_posts
              }
            }
          }
        }
      `,
      preloadedQuery.viewer,
    );

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

  const posts: PostsGrid_posts$key = useMemo(() => {
    return convertToNonNullArray(
      data.searchPosts.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.searchPosts.edges]);

  return (
    <PostsGrid
      posts={posts}
      canPlay={hasFocus}
      ListFooterComponent={
        <ListLoadingFooter loading={showLoadingIndicatorDebounced} />
      }
      refreshing={undefined}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      nestedScrollEnabled
      useWindowScroll
      style={{ marginTop: 10 }}
    />
  );
};

export default SearchResultPosts;

export const SearchResultPostsPlaceHolder = () => {
  return (
    <View style={styles.containerPlaceholder}>
      <View
        style={[
          styles.placeholderColumn,
          {
            paddingRight: 5,
          },
        ]}
      >
        <SkeletonPlaceholder style={[styles.postPlaceHolder, { height: 80 }]} />
        <SkeletonPlaceholder
          style={[styles.postPlaceHolder, { height: 210 }]}
        />
        <SkeletonPlaceholder
          style={[styles.postPlaceHolder, { height: 100 }]}
        />
        <SkeletonPlaceholder
          style={[styles.postPlaceHolder, { height: 400 }]}
        />
      </View>
      <View
        style={[
          styles.placeholderColumn,
          {
            paddingLeft: 5,
          },
        ]}
      >
        <SkeletonPlaceholder
          style={[styles.postPlaceHolder, { height: 130 }]}
        />
        <SkeletonPlaceholder style={[styles.postPlaceHolder, { height: 75 }]} />
        <SkeletonPlaceholder
          style={[styles.postPlaceHolder, { height: 230 }]}
        />
        <SkeletonPlaceholder
          style={[styles.postPlaceHolder, { height: 300 }]}
        />
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const WIDTH_POST = (width - 16) / 2;
const styles = StyleSheet.create({
  placeholderColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: WIDTH_POST,
  },
  containerPlaceholder: {
    marginLeft: 8,
    marginRight: 8,
    flexDirection: 'row',
    marginTop: 8,
  },
  postPlaceHolder: {
    width: '100%',
    marginBottom: 5,
    borderRadius: 16,
    backgroundColor: colors.grey50,
  },
});
