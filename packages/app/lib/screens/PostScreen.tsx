import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { Suspense, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import Header from '../components/Header';
import PostList from '../components/PostList';
import PostRenderer from '../components/PostRenderer';
import { useRouter } from '../PlatformEnvironment';
import IconButton from '../ui/IconButton';
import type { PostScreenFragment_post$key } from '@azzapp/relay/artifacts/PostScreenFragment_post.graphql';
import type { PostScreenFragment_relatedPost$key } from '@azzapp/relay/artifacts/PostScreenFragment_relatedPost.graphql';

type PostScreenProps = {
  post: PostScreenFragment_post$key & PostScreenFragment_relatedPost$key;
  ready?: boolean;
  initialVideoTime?: number | null;
};

const PostScreen = ({
  post: postKey,
  ready = true,
  initialVideoTime,
}: PostScreenProps) => {
  const router = useRouter();
  const onClose = () => {
    router.back();
  };

  const post = useFragment(
    graphql`
      fragment PostScreenFragment_post on Post {
        id
        ...PostRendererFragment_post
        author {
          ...PostRendererFragment_author
        }
      }
    `,
    postKey as PostScreenFragment_post$key,
  );

  /*
    Instead of this trick it could be insteresting to use the
    graphql @defer directive
  */

  const { width: windowWidth } = useWindowDimensions();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#fff', overflow: 'hidden' }}
    >
      <Header
        title={'Discover'}
        leftButton={<IconButton icon="chevron" onPress={onClose} />}
      />
      <FlatList
        data={emptyArray}
        renderItem={nullRender}
        ListHeaderComponent={
          <PostRenderer
            post={post}
            author={post.author}
            width={windowWidth}
            initialTime={initialVideoTime}
          />
        }
        ListFooterComponent={
          <Suspense
            fallback={
              <View style={{ flex: 1 }}>
                <ActivityIndicator style={{ marginTop: 50 }} />
              </View>
            }
          >
            <PostScreenList canPlay={ready} post={postKey} />
          </Suspense>
        }
      />
    </SafeAreaView>
  );
};

const emptyArray: never[] = [];
const nullRender = () => null;

export default PostScreen;

const PostScreenList = ({
  post,
  canPlay,
}: {
  post: PostScreenFragment_relatedPost$key;
  canPlay: boolean;
}) => {
  const {
    data: { relatedPosts },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment PostScreenFragment_relatedPost on Post
      @refetchable(queryName: "PostScreenQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        relatedPosts(after: $after, first: $first)
          @connection(key: "Post_relatedPosts") {
          edges {
            node {
              id
              ...PostList_posts @arguments(includeAuthor: true)
            }
          }
        }
      }
    `,
    post,
  );

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const posts = useMemo(
    () =>
      relatedPosts?.edges
        ? convertToNonNullArray(
            relatedPosts.edges.map(edge => edge?.node ?? null),
          )
        : [],
    [relatedPosts?.edges],
  );
  return (
    <PostList
      style={{ flex: 1 }}
      canPlay={canPlay}
      posts={posts}
      onEndReached={onEndReached}
    />
  );
};
