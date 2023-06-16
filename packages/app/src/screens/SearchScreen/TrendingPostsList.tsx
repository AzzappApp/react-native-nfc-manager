import { useCallback, useEffect, useMemo, useState } from 'react';

import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostsGrid from '#components/PostList/PostsGrid';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { TrendingPostsList_viewer$key } from '@azzapp/relay/artifacts/TrendingPostsList_viewer.graphql';
import type { ReactElement } from 'react';

type TrendingPostsListProps = {
  viewer: TrendingPostsList_viewer$key;
  canPlay: boolean;
  ListHeaderComponent?: ReactElement;
};

const TrendingPostsList = ({
  viewer,
  canPlay,
  ListHeaderComponent,
}: TrendingPostsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment TrendingPostsList_viewer on Viewer
        @refetchable(queryName: "TrendingPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
        ) {
          trendingPosts(after: $after, first: $first)
            @connection(key: "Viewer_trendingPosts") {
            edges {
              node {
                ...PostsGrid_posts
              }
            }
          }
        }
      `,
      viewer,
    );

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
  }, [isLoadingNext, hasNext, loadNext]);

  const [sowLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [showLoadingIndicatorDebounced] = useDebounce(sowLoadingIndicator, 150);
  useEffect(() => {
    setShowLoadingIndicator(!refreshing && isLoadingNext);
  }, [isLoadingNext, refreshing]);

  const posts: PostsGrid_posts$key = useMemo(
    () =>
      convertToNonNullArray(
        data?.trendingPosts?.edges?.map(edge => edge?.node) ?? [],
      ),
    [data?.trendingPosts?.edges],
  );

  return (
    <PostsGrid
      posts={posts}
      canPlay={canPlay}
      ListFooterComponent={
        <ListLoadingFooter loading={showLoadingIndicatorDebounced} />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      nestedScrollEnabled
      ListHeaderComponent={ListHeaderComponent}
    />
  );
};

export default TrendingPostsList;
