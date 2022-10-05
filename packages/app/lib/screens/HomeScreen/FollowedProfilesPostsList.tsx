import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import PostsGrid from '../../components/PostsGrid';
import ListLoadingFooter from '../../ui/ListLoadingFooter';
import type { FollowedProfilesPostsList_viewer$key } from '@azzapp/relay/artifacts/FollowedProfilesPostsList_viewer.graphql';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type FollowedProfilesPostsListProps = {
  viewer: FollowedProfilesPostsList_viewer$key;
  canPlay?: boolean;
  ListHeaderComponent?: ReactElement;
  stickyHeaderIndices?: number[] | undefined;
  style?: StyleProp<ViewStyle>;
  postsContainerStyle?: StyleProp<ViewStyle>;
};

const FollowedProfilesPostsList = ({
  viewer,
  canPlay,
  stickyHeaderIndices,
  ListHeaderComponent,
  style,
  postsContainerStyle,
}: FollowedProfilesPostsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment FollowedProfilesPostsList_viewer on Viewer
        @refetchable(queryName: "FollowedProfilesPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
        ) {
          followedProfilesPosts(after: $after, first: $first)
            @connection(key: "Viewer_followedProfilesPosts") {
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
        data.followedProfilesPosts.edges?.map(edge => edge?.node) ?? [],
      ),
    [data.followedProfilesPosts.edges],
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
      useWindowScroll
    />
  );
};

export default FollowedProfilesPostsList;
