import { useCallback, useMemo, useState } from 'react';

import { View, useWindowDimensions } from 'react-native';
import {
  graphql,
  usePaginationFragment,
  useSubscribeToInvalidationState,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostsGrid from '#components/PostList/PostsGrid';
import useScreenInsets from '#hooks/useScreenInsets';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import { TAB_BAR_MENU_ITEM_HEIGHT } from '#ui/TabBarMenuItem/TabBarMenuItem';
import type { ScrollableToOffset } from '#helpers/types';
import type { MediaFollowingsScreen_webCard$key } from '#relayArtifacts/MediaFollowingsScreen_webCard.graphql';
import type { PostsGrid_posts$key } from '#relayArtifacts/PostsGrid_posts.graphql';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type MediaFollowingsScreenScreenProps = {
  webCard: MediaFollowingsScreen_webCard$key;
  canPlay: boolean;
  ListHeaderComponent?: React.ReactElement<any> | null;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollableRef?: ScrollableToOffset;
};
const TAB_MENU_HEIGHT = TAB_BAR_MENU_ITEM_HEIGHT + 2 * 9;

const MediaFollowingsScreen = ({
  webCard,
  canPlay,
  ListHeaderComponent,
  onScroll,
  scrollableRef,
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

  const showLoadingIndicator = !refreshing && isLoadingNext;
  const [showLoadingIndicatorDebounced] = useDebounce(
    showLoadingIndicator,
    150,
  );

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

  const { height: screenHeight } = useWindowDimensions();
  const { top } = useScreenInsets();
  const minHeight = top + TAB_MENU_HEIGHT + 40;

  const ListFooterComponent = useMemo(
    () => (
      <View style={{ minHeight: screenHeight - minHeight }}>
        <ListLoadingFooter loading={showLoadingIndicatorDebounced} />
      </View>
    ),
    [minHeight, screenHeight, showLoadingIndicatorDebounced],
  );

  return (
    <PostsGrid
      scrollableRef={scrollableRef}
      posts={posts}
      canPlay={canPlay}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      nestedScrollEnabled
      onScroll={onScroll}
    />
  );
};

export default MediaFollowingsScreen;
