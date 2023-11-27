import { useCallback, useEffect, useMemo, useState } from 'react';

import { View } from 'react-native';
import {
  graphql,
  usePaginationFragment,
  useSubscribeToInvalidationState,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostsGrid from '#components/PostList/PostsGrid';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import type { MediaFollowingsScreen_webCard$key } from '@azzapp/relay/artifacts/MediaFollowingsScreen_webCard.graphql';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';

type MediaFollowingsScreenScreenProps = {
  webCard: MediaFollowingsScreen_webCard$key;
  canPlay: boolean;
  ListHeaderComponent?: React.ReactNode;
};

const MediaFollowingsScreen = ({
  webCard,
  canPlay,
  ListHeaderComponent,
}: MediaFollowingsScreenScreenProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MediaFollowingsScreen_webCard on WebCard
        @refetchable(queryName: "MediaFollowingsScreenListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          followingsPosts(after: $after, first: $first)
            @connection(key: "WebCard_followingsPosts") {
            __id
            edges {
              node {
                ...PostsGrid_posts
              }
            }
          }
        }
      `,
      webCard,
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
        data.followingsPosts?.edges?.map(edge => edge?.node) ?? [],
      ),
    [data.followingsPosts?.edges],
  );

  useSubscribeToInvalidationState([data.followingsPosts?.__id], () => {
    refetch({ after: null, first: 10 });
  });

  const ListFooterComponent = useMemo(
    () => (
      <View style={{ height: 80 }}>
        <ListLoadingFooter loading={showLoadingIndicatorDebounced} />
      </View>
    ),
    [showLoadingIndicatorDebounced],
  );

  return (
    <PostsGrid
      posts={posts}
      canPlay={canPlay}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      nestedScrollEnabled
    />
  );
};

export default MediaFollowingsScreen;
