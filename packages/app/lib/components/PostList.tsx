import { useCallback, useMemo, useState } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostRenderer from '../components/PostRenderer';
import ListLoadingFooter from '../ui/ListLoadingFooter';
import type {
  PostList_posts$data,
  PostList_posts$key,
} from '@azzapp/relay/artifacts/PostList_posts.graphql';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { ArrayItemType } from '@azzapp/shared/lib/arrayHelpers';
import type {
  StyleProp,
  ViewStyle,
  ListRenderItemInfo,
  LayoutRectangle,
} from 'react-native';

type PostListProps = {
  posts: PostList_posts$key;
  author?: PostRendererFragment_author$key;
  canPlay?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  initialVideoTimes?: Record<string, number | null | undefined>;
  style?: StyleProp<ViewStyle>;
};

const PostList = ({
  posts: postKey,
  author,
  canPlay = true,
  refreshing = false,
  loading = false,
  initialVideoTimes,
  onEndReached,
  onRefresh,
  style,
}: PostListProps) => {
  const posts = useFragment(
    graphql`
      fragment PostList_posts on Post
      @relay(plural: true)
      @argumentDefinitions(
        includeAuthor: { type: "Boolean!", defaultValue: false }
      ) {
        id
        ...PostRendererFragment_post
        author @include(if: $includeAuthor) {
          ...PostRendererFragment_author
        }
      }
    `,
    postKey,
  );

  const [postLayouts, setPostsLayouts] = useState<
    Record<string, LayoutRectangle | undefined>
  >({});

  const onPostLayout = useCallback(
    (postId: string, layout: LayoutRectangle) => {
      setPostsLayouts(map => ({
        ...map,
        [postId]: layout,
      }));
    },
    [],
  );

  const { width: windowWidth } = useWindowDimensions();
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Post>) => (
      <PostRenderer
        post={item}
        paused={!canPlay}
        width={windowWidth}
        author={item.author ?? author!}
        style={index !== 0 && { marginTop: 10 }}
        onLayout={e => onPostLayout(item.id, e.nativeEvent.layout)}
        initialTime={initialVideoTimes?.[item.id]}
      />
    ),
    [author, canPlay, initialVideoTimes, onPostLayout, windowWidth],
  );

  const snapToOffsets = useMemo(() => {
    const results: number[] = [];
    let currentOffset = 0;
    for (let i = 0; i < posts.length; i++) {
      results.push(currentOffset);
      const post = posts[i];
      const layout = postLayouts[post.id];
      if (!layout) {
        break;
      }
      currentOffset += layout.height + 10;
    }
    return results;
  }, [postLayouts, posts]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item, index) => item?.id ?? `${index}-null`}
      snapToOffsets={snapToOffsets}
      renderItem={renderItem}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={style}
      decelerationRate="fast"
      ListFooterComponent={<ListLoadingFooter loading={loading} />}
    />
  );
};

export default PostList;

type Post = ArrayItemType<PostList_posts$data>;
