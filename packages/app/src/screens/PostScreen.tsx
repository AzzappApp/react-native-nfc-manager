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
import { SafeAreaView } from 'react-native';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { useRouter } from '#PlatformEnvironment';
import PostList from '#components/PostList';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PostScreenFragment_post$key } from '@azzapp/relay/artifacts/PostScreenFragment_post.graphql';
import type {
  PostScreenFragment_relatedPosts$data,
  PostScreenFragment_relatedPosts$key,
} from '@azzapp/relay/artifacts/PostScreenFragment_relatedPosts.graphql';
import type { ForwardedRef } from 'react';

type PostScreenProps = {
  post: PostScreenFragment_post$key & PostScreenFragment_relatedPosts$key;
  ready?: boolean;
  hasFocus?: boolean;
  initialVideoTime?: number | null;
};

const PostScreen = ({
  post: postKey,
  ready = true,
  hasFocus = true,
  initialVideoTime,
}: PostScreenProps) => {
  const router = useRouter();
  const intl = useIntl();
  const onClose = () => {
    router.back();
  };

  const post = useFragment(
    graphql`
      fragment PostScreenFragment_post on Post {
        id
        ...PostList_posts @arguments(includeAuthor: true)
      }
    `,
    postKey as PostScreenFragment_post$key,
  );

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
            post,
            ...convertToNonNullArray(
              relatedPosts?.edges.map(edge => edge?.node ?? null),
            ),
          ]
        : [post],
    [post, relatedPosts],
  );

  const initialVideoTimes = useMemo(
    () => ({ [post.id]: initialVideoTime }),
    [initialVideoTime, post.id],
  );

  return (
    <SafeAreaView style={{ flex: 1, overflow: 'hidden' }}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Discover',
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
        initialVideoTimes={initialVideoTimes}
        loading={loading}
      />
      <Suspense>
        <RelatedPostLoader
          ref={relatedPostLoaderRef}
          post={postKey}
          onRelatedPostChange={onRelatedPostLoaded}
        />
      </Suspense>
    </SafeAreaView>
  );
};

export default PostScreen;

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
      @refetchable(queryName: "PostScreenQuery")
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
