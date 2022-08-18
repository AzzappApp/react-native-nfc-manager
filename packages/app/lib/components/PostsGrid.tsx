import { useCallback, useMemo } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostRenderer from './PostRenderer';
import type {
  PostsGrid_posts$data,
  PostsGrid_posts$key,
} from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ArraItemType } from '@azzapp/shared/lib/arrayHelpers';
import type { ReactElement } from 'react';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';

type PostsGrid = {
  posts: PostsGrid_posts$key;
  canPlay?: boolean;
  refreshing?: boolean;
  ListHeaderComponent?: ReactElement;
  stickyHeaderIndices?: number[] | undefined;
  onRefresh?: () => void;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  postsContainerStyle?: StyleProp<ViewStyle>;
};

const PostsGrid = ({
  posts: postsKey,
  refreshing,
  ListHeaderComponent,
  stickyHeaderIndices,
  onRefresh,
  onEndReached,
  style,
  contentContainerStyle,
  postsContainerStyle,
}: PostsGrid) => {
  const posts = useFragment(
    graphql`
      fragment PostsGrid_posts on Post @relay(plural: true) {
        id
        ...PostRendererFragment_post
        author {
          ...PostRendererFragment_author
        }
      }
    `,
    postsKey,
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const { width: windowWidth } = useWindowDimensions();
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) =>
      item ? (
        <PostRenderer
          post={item}
          width={(windowWidth - 30) / 2}
          author={item.author}
          small
          muted
          style={{ marginRight: 8, marginBottom: 8 }}
        />
      ) : null,
    [windowWidth],
  );

  const [even, odd] = useMemo(() => {
    const even: Post[] = [];
    const odd: Post[] = [];

    posts.forEach((item, index) => {
      if (index % 2 === 0) {
        even.push(item);
      } else {
        odd.push(item);
      }
    });
    return [even, odd];
  }, [posts]);

  // When you nest a VirtualizedList inside in other Virtualized List
  // with same direction, the ScrollView is not rendered but actually
  // both the 2 virtualized list share the same view.
  // To obtain a masonery layout we render 2 flat list side by side
  // One with odd data the other with even data
  const lists = useMemo(() => {
    const renderFlatList = (data: Post[], isOdd = false) => (
      <FlatList
        listKey={isOdd ? 'odd' : 'even'}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        style={{
          flex: 1,
          marginLeft: isOdd ? 0 : 8,
        }}
      />
    );
    return (
      <View style={{ flexDirection: 'row' }}>
        {renderFlatList(even)}
        {renderFlatList(odd, true)}
      </View>
    );
  }, [even, keyExtractor, odd, onEndReached, renderItem]);

  return (
    <FlatList
      data={emptyArray}
      renderItem={nullRender}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={lists}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickyHeaderIndices={stickyHeaderIndices}
      style={style}
      contentContainerStyle={contentContainerStyle}
      ListFooterComponentStyle={postsContainerStyle}
    />
  );
};

export default PostsGrid;

type Post = ArraItemType<PostsGrid_posts$data>;

const emptyArray: unknown[] = [];
const nullRender = () => null;
