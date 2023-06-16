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
import { useIntl } from 'react-intl';
import { Dimensions, Platform, SafeAreaView } from 'react-native';
import { graphql, usePaginationFragment, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import { AUTHOR_CARTOUCHE_HEIGHT } from '#components/AuthorCartouche';
import { useNativeNavigationEvent, useRouter } from '#components/NativeRouter';
import PostList from '#components/PostList/PostList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostRoute } from '#routes';
import type {
  PostScreenFragment_relatedPosts$data,
  PostScreenFragment_relatedPosts$key,
} from '@azzapp/relay/artifacts/PostScreenFragment_relatedPosts.graphql';
import type { PostScreenQuery } from '@azzapp/relay/artifacts/PostScreenQuery.graphql';
import type { ForwardedRef } from 'react';
import type { EdgeInsets } from 'react-native-safe-area-context';

const postScreenQuery = graphql`
  query PostScreenQuery($postId: ID!) {
    node(id: $postId) {
      id
      ...PostList_posts @arguments(includeAuthor: true)
      ...PostScreenFragment_relatedPosts
    }
  }
`;

const PostScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<PostRoute, PostScreenQuery>) => {
  const router = useRouter();
  const intl = useIntl();
  const onClose = () => {
    router.back();
  };

  const { node: post } = usePreloadedQuery(postScreenQuery, preloadedQuery);
  const [ready, setReady] = useState(false);

  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });

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
  const styles = useStyleSheet(styleSheet);

  if (!post) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Related Posts',
          description: 'Post screen header title',
        })}
        leftElement={
          <IconButton
            icon="arrow_down"
            onPress={onClose}
            iconSize={30}
            size={47}
            style={{ borderWidth: 0 }}
          />
        }
      />
      <PostList
        style={{ flex: 1 }}
        canPlay={ready && hasFocus}
        posts={posts}
        onEndReached={onEndReached}
        loading={loading}
      />
      <Suspense>
        <RelatedPostLoader
          ref={relatedPostLoaderRef}
          post={post}
          onRelatedPostChange={onRelatedPostLoaded}
        />
      </Suspense>
    </SafeAreaView>
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
  getVariables: ({ postId }) => ({ postId }),
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
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        relatedPosts(after: $after, first: $first)
          @connection(key: "Post_relatedPosts") {
          edges {
            node {
              ...PostList_posts @arguments(includeAuthor: true)
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

const styleSheet = createStyleSheet(appearance => ({
  safeAreaView: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
}));
