import { FlatList, useWindowDimensions } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostRenderer from '../components/PostRenderer';
import type { PostList_posts$key } from '@azzapp/relay/artifacts/PostList_posts.graphql';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type PostListProps = {
  posts: PostList_posts$key;
  author?: PostRendererFragment_author$key;
  canPlay?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PostList = ({
  posts: postKey,
  author,
  canPlay = true,
  refreshing,
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

  const { width: windowWidth } = useWindowDimensions();
  return (
    <FlatList
      data={posts}
      keyExtractor={(item, index) => item?.id ?? `${index}-null`}
      renderItem={({ item }) => (
        <PostRenderer
          post={item}
          paused={!canPlay}
          width={windowWidth}
          author={item.author ?? author!}
        />
      )}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      refreshing={refreshing ?? false}
      onRefresh={onRefresh}
      style={style}
    />
  );
};

export default PostList;
