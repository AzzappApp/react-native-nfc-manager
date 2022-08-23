import range from 'lodash/range';
import { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostRenderer from './PostRenderer';
import type {
  PostsGrid_posts$data,
  PostsGrid_posts$key,
} from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ArraItemType } from '@azzapp/shared/lib/arrayHelpers';
import type { ReactNode } from 'react';
import type {
  StyleProp,
  ViewStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';

type PostsGrid = {
  posts: PostsGrid_posts$key;
  canPlay?: boolean;
  refreshing?: boolean;
  ListHeaderComponent?: ReactNode;
  ListFooterComponent?: ReactNode;
  stickyHeaderIndices?: number[] | undefined;
  onRefresh?: () => void;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  postsContainerStyle?: StyleProp<ViewStyle>;
};

// This is an attemps to Use recycling for post list with custom layout
// Since the layout can be predetermined we simply add remove element and keep same
// key to do recycling

const PostsGrid = ({
  posts: postsKey,
  refreshing,
  ListHeaderComponent,
  ListFooterComponent,
  stickyHeaderIndices,
  onRefresh,
  onEndReached,
  style,
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
        media {
          ratio
        }
        content
      }
    `,
    postsKey,
  );

  const { width: windowWidth } = useWindowDimensions();
  const [contentHeight, dataWithLayout] = useMemo(() => {
    const even: Post[] = [];
    const odd: Post[] = [];

    posts.forEach((item, index) => {
      if (!item) {
        console.log('no item for index ', index);
        return;
      }
      if (index % 2 === 0) {
        even.push(item);
      } else {
        odd.push(item);
      }
    });

    const { padding, paddingVertical, paddingTop, paddingBottom } =
      StyleSheet.flatten(postsContainerStyle ?? {});

    let offsetTop = paddingTop ?? paddingVertical ?? padding ?? 0;
    let offsetBottom = paddingBottom ?? paddingVertical ?? padding ?? 0;
    if (typeof offsetTop === 'string' || typeof offsetBottom === 'string') {
      console.warn(
        'PostGrid: percent padding are not supported in postsContainerStyle',
      );
      if (typeof offsetTop === 'string') {
        offsetTop = 0;
      }
      if (typeof offsetBottom === 'string') {
        offsetBottom = 0;
      }
    }

    // window width - the 3 margin of 8px
    const itemWidth = (windowWidth - 24) / 2;
    let currentPosition = offsetTop;
    const measureItem = (item: Post, isOdd: boolean) => {
      const layout = {
        left: isOdd ? itemWidth + 16 : 8,
        top: currentPosition,
        width: itemWidth,
        // media margin between next and media, text height
        height: itemWidth / item.media.ratio + 5 + (item.content ? 34 : 0),
      };
      //  margin with bottom
      currentPosition += layout.height + 8;
      return { item, layout };
    };

    const evenData = even.map(item => measureItem(item, false));
    let height = currentPosition;
    currentPosition = offsetTop;
    const oddData = odd.map(item => measureItem(item, true));
    height = Math.max(height, currentPosition);
    return [height + offsetBottom, [...evenData, ...oddData]];
  }, [posts, windowWidth, postsContainerStyle]);

  const [currentBatch, setCurrentBatch] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [headerSize, setHeaderSize] = useState(0);
  const batchSize = scrollViewHeight;

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderSize(e.nativeEvent.layout.height);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setScrollViewHeight(e.nativeEvent.layout.height);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = e.nativeEvent.contentOffset.y;
    if (contentHeight - scrollPosition < scrollViewHeight * 2) {
      onEndReached?.();
    }

    setCurrentBatch(
      Math.floor(Math.max(scrollPosition - headerSize, 0) / batchSize),
    );
  };

  // the batch system works by determining a list of item
  // to display on 'page' of the scroll view and by moving the
  // page on the bottom and on top during scroll
  // since we always reuse the same key react-native should not
  // recreate view
  const items = useMemo(() => {
    const positions = range(currentBatch - 2, currentBatch + 2);
    const batchIndexes = [0, 0, 0, 0];

    const results: Array<{
      item: Post;
      layout: ViewStyle;
      key: string;
      currentLayoutPostion: number;
    }> = [];

    dataWithLayout.forEach(({ item, layout }) => {
      if (!item || !layout) {
        return null;
      }
      positions.forEach((position, index) => {
        if (position < 0) {
          return;
        }
        const currentLayoutPostion = position * batchSize;
        const nextLayoutPosition = (position + 1) * batchSize;
        const prefix = BATCHES[(2 + position) % 4];
        if (
          layout.top >= currentLayoutPostion &&
          layout.top < nextLayoutPosition
        ) {
          results.push({
            item,
            layout,
            key: `${prefix}-${batchIndexes[index]++}`,
            currentLayoutPostion,
          });
        }
      });
    });
    return results;
  }, [dataWithLayout, currentBatch, batchSize]);

  return (
    <ScrollView
      scrollEventThrottle={16}
      onScroll={onScroll}
      onLayout={onLayout}
      style={style}
      stickyHeaderIndices={stickyHeaderIndices}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      refreshControl={
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
        />
      }
    >
      {ListHeaderComponent && (
        <View onLayout={onHeaderLayout}>{ListHeaderComponent}</View>
      )}
      <View style={[{ height: contentHeight }, postsContainerStyle]}>
        {items.map(({ key, item, layout }) => (
          <PostRenderer
            key={key}
            post={item}
            width={(windowWidth - 24) / 2}
            author={item.author}
            small
            muted
            style={[{ position: 'absolute' }, layout]}
          />
        ))}
      </View>
      {ListFooterComponent}
    </ScrollView>
  );
};

export default PostsGrid;

type Post = ArraItemType<PostsGrid_posts$data>;

const BATCHES = ['first', 'second', 'third', 'four'];
