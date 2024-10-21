import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostsGrid, { PostGridFallback } from '#components/PostList/PostsGrid';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import Text from '#ui/Text';
import MediaSuggestionsWebCards, {
  MediaSuggestionWebCardFallback,
} from './MediaSuggestionsWebCards';
import type { MediaSuggestionsScreen_profile$key } from '#relayArtifacts/MediaSuggestionsScreen_profile.graphql';
import type { MediaSuggestionsScreenInner_profile$key } from '#relayArtifacts/MediaSuggestionsScreenInner_profile.graphql';
import type { PostsGrid_posts$key } from '#relayArtifacts/PostsGrid_posts.graphql';
import type { ReactElement } from 'react';

type MediaSuggestionsScreenProps = {
  profile: MediaSuggestionsScreen_profile$key;
  isCurrentTab: boolean;
  canPlay: boolean;
};

const MediaSuggestionsScreen = ({
  profile: profileKey,
  isCurrentTab,
  canPlay,
}: MediaSuggestionsScreenProps) => {
  const profile = useFragment(
    graphql`
      fragment MediaSuggestionsScreen_profile on Profile {
        ...MediaSuggestionsScreenInner_profile
        ...MediaSuggestionsWebCards_profile
        webCard {
          ...MediaSuggestionsWebCards_webCard
        }
      }
    `,
    profileKey,
  );
  return (
    <MediaSuggestionsScreenInner
      profile={profile}
      canPlay={canPlay}
      ListHeaderComponent={
        <View>
          <CoverSuggestionTitle />
          <MediaSuggestionsWebCards
            profile={profile}
            webCard={profile.webCard}
            isCurrentTab={isCurrentTab}
          />
          <PostSuggestionTitle />
        </View>
      }
    />
  );
};

type MediaSuggestionsScreenInnerProps = {
  profile: MediaSuggestionsScreenInner_profile$key;
  canPlay: boolean;
  ListHeaderComponent: ReactElement<any> | null;
};

const MediaSuggestionsScreenInner = ({
  profile,
  canPlay,
  ListHeaderComponent,
}: MediaSuggestionsScreenInnerProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MediaSuggestionsScreenInner_profile on Profile
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

const CoverSuggestionTitle = () => (
  <Text variant="large" style={styles.coversTitleStyle}>
    <FormattedMessage
      defaultMessage="Webcards{azzappA} to follow"
      description="List of suggested profiles"
      values={{
        azzappA: <Text variant="azzapp">a</Text>,
      }}
    />
  </Text>
);

const PostSuggestionTitle = () => (
  <Text style={styles.postsTitleStyle} variant="large">
    <FormattedMessage
      defaultMessage="Posts"
      description="List of suggested posts"
    />
  </Text>
);

export default MediaSuggestionsScreen;

export const MediaSuggestionsScreenFallback = () => (
  <View style={{ flex: 1 }}>
    <CoverSuggestionTitle />
    <MediaSuggestionWebCardFallback />
    <PostSuggestionTitle />
    <PostGridFallback />
  </View>
);

const styles = StyleSheet.create({
  coversTitleStyle: {
    marginHorizontal: 10,
    marginTop: 6.5,
  },
  postsTitleStyle: {
    marginHorizontal: 10,
    marginBottom: 20,
  },
});
