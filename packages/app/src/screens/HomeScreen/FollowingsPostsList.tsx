import { useCallback, useEffect, useMemo, useState } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostsGrid from '#components/PostList/PostsGrid';
import { useFocusEffect } from '#hooks/useFocusEffect';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import type { FollowingsPostsList_viewer$key } from '@azzapp/relay/artifacts/FollowingsPostsList_viewer.graphql';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type FollowingsPostsListProps = {
  viewer: FollowingsPostsList_viewer$key;
  canPlay?: boolean;
  ListHeaderComponent?: ReactElement;
  stickyHeaderIndices?: number[] | undefined;
  style?: StyleProp<ViewStyle>;
  postsContainerStyle?: StyleProp<ViewStyle>;
  onScroll?: (scrollPosition: number) => void;
  onReady?: () => void;
};

const FollowingsPostsList = ({
  viewer,
  canPlay,
  stickyHeaderIndices,
  ListHeaderComponent,
  style,
  postsContainerStyle,
  onScroll,
  onReady,
}: FollowingsPostsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment FollowingsPostsList_viewer on Viewer
        @refetchable(queryName: "FollowingsPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 8 } #defaut value will impact the initial loading time
        ) {
          followingsPosts(after: $after, first: $first)
            @connection(key: "Viewer_followingsPosts") {
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

  const refetchPosts = useCallback(() => {
    refetch(
      {},
      {
        fetchPolicy: 'store-or-network',
      },
    );
  }, [refetch]);

  useFocusEffect(refetchPosts);

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
        data.followingsPosts?.edges?.map(edge => edge?.node) ?? [],
      ),
    [data.followingsPosts?.edges],
  );

  return (
    <PostsGrid
      posts={posts}
      canPlay={canPlay}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        <ListLoadingFooter loading={showLoadingIndicatorDebounced} />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      stickyHeaderIndices={stickyHeaderIndices}
      style={style}
      postsContainerStyle={postsContainerStyle}
      onScroll={onScroll}
      onReady={onReady}
    />
  );
};

export default FollowingsPostsList;
