import { useState, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { graphql, usePaginationFragment, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/PostList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { LikedPostsScreen_webCard$key } from '#relayArtifacts/LikedPostsScreen_webCard.graphql';
import type { LikedPostsScreenQuery } from '#relayArtifacts/LikedPostsScreenQuery.graphql';
import type { LikedPostsRoute } from '#routes';

const likedPostsScreenQuery = graphql`
  query LikedPostsScreenQuery($webCardId: ID!) {
    node(id: $webCardId) {
      ...LikedPostsScreen_webCard
        @arguments(viewerWebCardId: $webCardId)
        @alias(as: "webCard")
    }
  }
`;

const LikedPostsScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<LikedPostsRoute, LikedPostsScreenQuery>) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const router = useRouter();
  const onClose = () => {
    router.back();
  };

  const { node } = usePreloadedQuery(likedPostsScreenQuery, preloadedQuery);
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment LikedPostsScreen_webCard on WebCard
        @refetchable(queryName: "LikedPostListScreenQuery")
        @argumentDefinitions(
          viewerWebCardId: { type: "ID!" }
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          likedPosts(after: $after, first: $first)
            @connection(key: "LikedPostsScreen_likedPosts") {
            __id
            edges {
              node {
                ...PostList_posts
                  @arguments(
                    includeAuthor: true
                    viewerWebCardId: $viewerWebCardId
                  )
              }
            }
          }
        }
      `,
      (node?.webCard ?? null) as LikedPostsScreen_webCard$key | null,
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
      data?.likedPosts?.edges
        ? convertToNonNullArray(
            data.likedPosts.edges.map(edge => edge?.node ?? null),
          )
        : [],
    [data?.likedPosts.edges],
  );

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Post I liked',
          description: 'LikedPosts screen header title',
        })}
        leftElement={
          <IconButton
            icon="arrow_left"
            onPress={onClose}
            iconSize={30}
            size={47}
            variant="icon"
          />
        }
      />
      <PostList
        posts={posts}
        canPlay={hasFocus}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};
export default relayScreen(LikedPostsScreen, {
  query: likedPostsScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
  fetchPolicy: 'store-and-network',
});

const styleSheet = createStyleSheet(appearance => ({
  safeAreaView: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
}));
