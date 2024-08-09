import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostsGrid from '#components/PostList/PostsGrid';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import type { MediaSuggestionsScreen_profile$key } from '#relayArtifacts/MediaSuggestionsScreen_profile.graphql';
import type { PostsGrid_posts$key } from '#relayArtifacts/PostsGrid_posts.graphql';

type MediaSuggestionsScreenProps = {
  profile: MediaSuggestionsScreen_profile$key;
  canPlay: boolean;
  ListHeaderComponent?: React.ReactElement<any> | null;
};

const MediaSuggestionsScreen = ({
  profile,
  canPlay,
  ListHeaderComponent,
}: MediaSuggestionsScreenProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MediaSuggestionsScreen_profile on Profile
        @refetchable(queryName: "MediaSuggestionsScreenListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 15 }
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
      profile,
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
        data.trendingPosts?.edges?.map(edge => edge?.node) ?? [],
      ),
    [data.trendingPosts?.edges],
  );

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

export default MediaSuggestionsScreen;
