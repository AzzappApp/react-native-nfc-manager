import { useState, useCallback, memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { usePaginationFragment, graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostList from './PostList';
import type { ScrollableToOffset } from '#helpers/types';
import type { WebCardPostsList_author$key } from '#relayArtifacts/WebCardPostsList_author.graphql';
import type { WebCardPostsList_webCard$key } from '#relayArtifacts/WebCardPostsList_webCard.graphql';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const WebCardPostsList = ({
  webCard,
  author: authorKey,
  canPlay,
  onPressAuthor,
  onScroll,
  ListHeaderComponent,
  scrollableRef,
}: {
  webCard: WebCardPostsList_webCard$key;
  author: WebCardPostsList_author$key;
  canPlay: boolean;
  onPressAuthor?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  scrollableRef?: ScrollableToOffset;
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
      webCard,
    );

  const author = useFragment(
    graphql`
      fragment WebCardPostsList_author on WebCard {
        ...PostList_author
      }
    `,
    authorKey,
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
      author={author}
      canPlay={canPlay}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onRefresh={onRefresh}
      contentContainerStyle={styles.container}
      showUnpublished
      onScroll={onScroll}
      ListHeaderComponent={ListHeaderComponent}
      scrollableRef={scrollableRef}
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
