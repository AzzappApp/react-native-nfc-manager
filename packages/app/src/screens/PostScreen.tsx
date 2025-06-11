import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Dimensions, Platform, View, StyleSheet } from 'react-native';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { graphql, usePaginationFragment, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { AUTHOR_CARTOUCHE_HEIGHT } from '#components/AuthorCartouche';
import { useDidAppear, useRouter } from '#components/NativeRouter';
import PostList from '#components/PostList/PostList';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type {
  PostScreenFragment_relatedPosts$data,
  PostScreenFragment_relatedPosts$key,
} from '#relayArtifacts/PostScreenFragment_relatedPosts.graphql';
import type { PostScreenQuery } from '#relayArtifacts/PostScreenQuery.graphql';
import type { PostRoute } from '#routes';
import type { ForwardedRef } from 'react';

const postScreenQuery = graphql`
  query PostScreenQuery($postId: ID!, $webCardId: ID!) {
    node(id: $postId) {
      ... on Post @alias(as: "post") {
        ...PostList_posts
          @arguments(includeAuthor: true, viewerWebCardId: $webCardId)
        ...PostScreenFragment_relatedPosts
          @arguments(viewerWebCardId: $webCardId)
      }
    }
  }
`;

const PostScreen = ({
  preloadedQuery,
  hasFocus,
  route: {
    params: { videoTime },
  },
}: RelayScreenProps<PostRoute, PostScreenQuery>) => {
  const router = useRouter();
  const intl = useIntl();
  const onClose = () => {
    router.back();
  };

  const { node } = usePreloadedQuery(postScreenQuery, preloadedQuery);
  const post = node?.post;

  const ready = useDidAppear();

  const [relatedPosts, setRelatedPosts] = useState<
    PostScreenFragment_relatedPosts$data['relatedPosts'] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const relatedPostLoaderRef = useRef<RelatedPostLoaderHandle>(null);

  const onRelatedPostLoaded = useCallback(
    (
      relatedPosts: PostScreenFragment_relatedPosts$data['relatedPosts'],
      isLoadingNext: boolean,
    ) => {
      setRelatedPosts(relatedPosts);
      setLoading(isLoadingNext);
    },
    [],
  );

  const onEndReached = () => {
    relatedPostLoaderRef.current?.onEndReached();
  };

  const posts = useMemo(
    () =>
      relatedPosts?.edges
        ? [
            post!,
            ...convertToNonNullArray(
              relatedPosts?.edges.map(edge => edge?.node ?? null),
            ),
          ]
        : [post!],
    [post, relatedPosts],
  );

  const { top } = useScreenInsets();

  return (
    <Container style={[styles.container, { paddingTop: top }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Related Posts',
          description: 'Post screen header title',
        })}
        leftElement={
          <IconButton icon="arrow_down" onPress={onClose} variant="icon" />
        }
      />
      {!post ? (
        <View style={styles.noPostContainer}>
          <Text variant="large">
            <FormattedMessage
              defaultMessage="The post doesn't exist"
              description="PostScreen error message when the post doesn't exist"
            />
          </Text>
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Go back',
              description:
                "PostScreen - Go back button when post doesn't exist",
            })}
            onPress={router.back}
          />
        </View>
      ) : (
        <>
          <PostList
            canPlay={ready && hasFocus}
            posts={posts}
            onEndReached={onEndReached}
            loading={loading}
            firstItemVideoTime={videoTime}
            onPostDeleted={router.back}
          />
          <Suspense>
            <RelatedPostLoader
              ref={relatedPostLoaderRef}
              post={post}
              onRelatedPostChange={onRelatedPostLoaded}
            />
          </Suspense>
        </>
      )}
    </Container>
  );
};

PostScreen.getScreenOptions = (
  { fromRectangle }: PostRoute['params'],
  safeArea: EdgeInsets,
): ScreenOptions | null => {
  if (Platform.OS !== 'ios') {
    // TODO make it works on android
    return { stackAnimation: 'default' };
  }
  if (!fromRectangle) {
    return null;
  }
  const windowWidth = Dimensions.get('window').width;
  return {
    stackAnimation: 'custom',
    stackAnimationOptions: {
      animator: 'reveal',
      fromRectangle,
      toRectangle: {
        x: 0,
        y: safeArea.top + HEADER_HEIGHT + AUTHOR_CARTOUCHE_HEIGHT,
        width: windowWidth,
        height: (windowWidth * fromRectangle.height) / fromRectangle.width,
      },
      fromRadius: (16 / fromRectangle.width) * windowWidth,
      toRadius: 0,
    },
    transitionDuration: 220,
    customAnimationOnSwipe: true,
    gestureEnabled: true,
  };
};

export default relayScreen(PostScreen, {
  query: postScreenQuery,
  getVariables: ({ postId }, profileInfos) => ({
    postId,
    webCardId: profileInfos?.webCardId ?? '',
  }),
});

type RelatedPostLoaderHandle = { onEndReached(): void };

const RelatedPostLoaderInner = (
  {
    post,
    onRelatedPostChange: onRelatedLoadedStateChange,
  }: {
    post: PostScreenFragment_relatedPosts$key;
    onRelatedPostChange: (
      posts: PostScreenFragment_relatedPosts$data['relatedPosts'],
      isLoadingNext: boolean,
    ) => void;
  },
  forwardedRef: ForwardedRef<RelatedPostLoaderHandle>,
) => {
  const {
    data: { relatedPosts },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment PostScreenFragment_relatedPosts on Post
      @refetchable(queryName: "RelatedPostScreenQuery")
      @argumentDefinitions(
        viewerWebCardId: { type: "ID!" }
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        relatedPosts(after: $after, first: $first)
          @connection(key: "Post_relatedPosts") {
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
    post,
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      onEndReached() {
        if (!isLoadingNext && hasNext) {
          loadNext(10);
        }
      },
    }),
    [isLoadingNext, hasNext, loadNext],
  );

  useEffect(() => {
    onRelatedLoadedStateChange(relatedPosts, isLoadingNext);
  }, [isLoadingNext, onRelatedLoadedStateChange, relatedPosts]);

  return null;
};

const RelatedPostLoader = forwardRef(RelatedPostLoaderInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noPostContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
});
