import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useMemo, useState } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import PostsGrid from '../components/PostsGrid';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { RecommandedPostsList_viewer$key } from '@azzapp/relay/artifacts/RecommandedPostsList_viewer.graphql';
import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type RecommandedPostsListProps = {
  viewer: RecommandedPostsList_viewer$key;
  canPlay?: boolean;
  ListHeaderComponent?: ReactElement;
  stickyHeaderIndices?: number[] | undefined;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  postsContainerStyle?: StyleProp<ViewStyle>;
};

const RecommandedPostsList = ({
  viewer,
  canPlay,
  stickyHeaderIndices,
  ListHeaderComponent,
  style,
  contentContainerStyle,
  postsContainerStyle,
}: RecommandedPostsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment RecommandedPostsList_viewer on Viewer
        @refetchable(queryName: "RecommandedPostsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
        ) {
          recommandedPosts(after: $after, first: $first)
            @connection(key: "Viewer_recommandedPosts") {
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

  const posts: PostsGrid_posts$key = useMemo(
    () =>
      convertToNonNullArray(
        data.recommandedPosts.edges?.map(edge => edge?.node) ?? [],
      ),
    [data.recommandedPosts.edges],
  );

  return (
    <PostsGrid
      posts={posts}
      canPlay={canPlay}
      ListHeaderComponent={ListHeaderComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      stickyHeaderIndices={stickyHeaderIndices}
      style={style}
      contentContainerStyle={contentContainerStyle}
      postsContainerStyle={postsContainerStyle}
    />
  );
};

export default RecommandedPostsList;
