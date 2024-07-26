import { useState, useCallback, useMemo, memo } from 'react';
import { StyleSheet } from 'react-native';
import { usePaginationFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostList from './PostList';
import type { PostList_viewerWebCard$key } from '#relayArtifacts/PostList_viewerWebCard.graphql';
import type { PostRendererFragment_author$key } from '#relayArtifacts/PostRendererFragment_author.graphql';
import type { WebCardPostsList_webCard$key } from '#relayArtifacts/WebCardPostsList_webCard.graphql';

const WebCardPostsList = ({
  viewerWebCard,
  webCard,
  canPlay,
  onPressAuthor,
}: {
  viewerWebCard?: PostList_viewerWebCard$key;
  webCard: PostRendererFragment_author$key & WebCardPostsList_webCard$key;
  canPlay: boolean;
  onPressAuthor?: () => void;
}) => {
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment WebCardPostsList_webCard on WebCard
        @refetchable(queryName: "WebCardPostsList_webCard_posts_query")
        @argumentDefinitions(
          viewerWebCardId: { type: "ID!" }
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          posts(after: $after, first: $first)
            @connection(key: "WebCardPostsList_webCard_connection_posts") {
            edges {
              node {
                id
                ...PostList_posts
                  @arguments(
                    includeAuthor: false
                    viewerWebCardId: $viewerWebCardId
                  )
              }
            }
          }
        }
      `,
      webCard as WebCardPostsList_webCard$key,
    );

  const [refreshing, setRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !refreshing) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, refreshing, loadNext]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (!refreshing && !isLoadingNext) {
      refetch(
        {},
        {
          fetchPolicy: 'store-and-network',
          onComplete() {
            setRefreshing(false);
          },
        },
      );
    }
  }, [isLoadingNext, refetch, refreshing]);

  const posts = useMemo(
    () =>
      data.posts?.edges
        ? convertToNonNullArray(
            data.posts.edges.map(edge => edge?.node ?? null),
          )
        : [],
    [data.posts?.edges],
  );

  return (
    <PostList
      posts={posts}
      onPressAuthor={onPressAuthor}
      author={webCard}
      canPlay={canPlay}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onRefresh={onRefresh}
      contentContainerStyle={styles.container}
      viewerWebCard={viewerWebCard}
      showUnpublished={true}
    />
  );
};

//TODO: should be tested in real condition, on dev android, it feels better
export default memo(WebCardPostsList);

const FOOTER_ICONS_HEIGHT = 50;

const styles = StyleSheet.create({
  container: {
    paddingBottom: FOOTER_ICONS_HEIGHT,
  },
});
