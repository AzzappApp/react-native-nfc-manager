import cuid from 'cuid';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import PostLink from '../PostLink';
import PostGridContainer from './PostGridContainer';
import PostGridWindowScrollContainer from './PostGridWindowScrollContainer';
import type { ItemLayout, Post } from './types';
import type { PostsGrid_posts$key } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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
  useWindowScroll?: boolean;
};

// This is an attemps to Use recycling for post list with custom layout
// Since the layout can be predetermined we remove and add elements depending of the scroll position
// and maintains a pool of key to avoid recreating native view

const PostsGrid = ({
  posts: postsKey,
  canPlay,
  refreshing,
  ListHeaderComponent,
  ListFooterComponent,
  stickyHeaderIndices,
  onRefresh,
  onEndReached,
  style,
  postsContainerStyle,
  useWindowScroll,
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
          __typename
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
        console.warn('no item in post grid for index ', index);
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
        height: itemWidth / item.media.ratio,
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

  const [layoutPosition, setLayoutPosition] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [headerSize, setHeaderSize] = useState(0);
  const [isScrollingToTop, setIsScrollingToTop] = useState(false);

  const onWillScrollToTop = () => {
    setIsScrollingToTop(true);
  };

  const onScroll = (scrollPosition: number) => {
    if (contentHeight - scrollPosition < scrollViewHeight * 2) {
      onEndReached?.();
    }
    if (isScrollingToTop && scrollPosition === 0) {
      setIsScrollingToTop(false);
    }

    setLayoutPosition(
      Math.floor(
        (Math.max(scrollPosition - headerSize, 0) * BATCH_SIZE) /
          scrollViewHeight,
      ) / BATCH_SIZE,
    );
  };

  const postMap = useMemo(() => {
    const postMap = new Map<string, { item: Post; layout: ItemLayout }>();
    dataWithLayout.forEach(data => {
      postMap.set(data.item.id, data);
    });
    return postMap;
  }, [dataWithLayout]);

  const keys = useRef({
    videos: new Map<string, string>(),
    images: new Map<string, string>(),
  });

  const itemRefs = useRef<Array<[string, string]>>([]);
  const items = useMemo(() => {
    if (isScrollingToTop) {
      return itemRefs.current;
    }
    const topLimit = (layoutPosition - 0.5) * scrollViewHeight;
    const bottomLimit = (layoutPosition + 1.25) * scrollViewHeight;

    const { videos: videosKeys, images: imagesKeys } = keys.current;

    const freeImageKeysMap = new Map(imagesKeys);
    const freeVideoKeysMap = new Map(videosKeys);

    const items: Array<[string, string]> = [];

    for (let i = 0; i < dataWithLayout.length; i++) {
      const { item, layout } = dataWithLayout[i];
      if (layout.top >= topLimit && layout.top < bottomLimit) {
        const freeKeys =
          item.media.__typename === 'MediaVideo'
            ? freeVideoKeysMap
            : freeImageKeysMap;
        const key = freeKeys.get(item.id);
        if (key) {
          freeKeys.delete(item.id);
        }
        items.push([item.id, key ?? '']);
      }
    }

    const freeImageKeys = Array.from(freeImageKeysMap.entries());
    const freeVideoKeys = Array.from(freeVideoKeysMap.entries());

    for (let i = 0; i < items.length; i++) {
      let key = items[i][1];
      const item = postMap.get(items[i][0])!.item;
      if (!key) {
        const freeKeys =
          item.media.__typename === 'MediaVideo'
            ? freeVideoKeys
            : freeImageKeys;
        const usedKeys =
          item.media.__typename === 'MediaVideo' ? videosKeys : imagesKeys;
        const entry = freeKeys.pop();
        if (entry) {
          key = entry[1];
          usedKeys.delete(entry[0]);
        } else {
          key = cuid();
        }
        usedKeys.set(item.id, key);
        items[i][1] = key;
      }
    }

    freeImageKeys.forEach(([id]) => imagesKeys.delete(id));
    freeVideoKeys.forEach(([id]) => videosKeys.delete(id));
    keys.current = {
      images: new Map([...imagesKeys.entries(), ...freeImageKeys]),
      videos: new Map([...videosKeys.entries(), ...freeVideoKeys]),
    };
    items.push(...freeImageKeys);
    items.push(...freeVideoKeys);

    return items;
  }, [
    isScrollingToTop,
    layoutPosition,
    scrollViewHeight,
    dataWithLayout,
    postMap,
  ]);
  itemRefs.current = items;

  const placeHolders = useMemo(
    () =>
      dataWithLayout.map(({ item, layout }) => (
        <View key={item.id} style={[layout, { position: 'absolute' }]}>
          <View
            style={{
              width: layout.width,
              height: layout.width / item.media.ratio,
              borderRadius: 16,
              backgroundColor: colors.grey200,
            }}
          />
        </View>
      )),
    [dataWithLayout],
  );

  const GridContainer = Platform.select({
    default: PostGridContainer,
    web: useWindowScroll ? PostGridWindowScrollContainer : PostGridContainer,
  });

  return (
    <GridContainer
      contentHeight={contentHeight}
      stickyHeaderIndices={stickyHeaderIndices}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      style={style}
      postsContainerStyle={postsContainerStyle}
      onRefresh={onRefresh}
      onScroll={onScroll}
      onScrollViewHeightChange={setScrollViewHeight}
      onHeaderHeightChange={setHeaderSize}
      onWillScrollToTop={onWillScrollToTop}
    >
      {placeHolders}
      {items.map(([id, key]) => {
        const data = postMap.get(id);
        if (!data) {
          console.warn('null data for id ' + id);
          return null;
        }
        return (
          <MemoPostRenderer
            key={key}
            item={data.item}
            windowWidth={windowWidth}
            layout={data.layout}
            paused={!canPlay}
          />
        );
      })}
    </GridContainer>
  );
};

export default PostsGrid;

const MemoPostRenderer = ({
  item,
  layout,
  windowWidth,
  paused,
}: {
  item: Post;
  paused?: boolean;
  windowWidth: number;
  layout: ItemLayout;
}) =>
  useMemo(
    () => (
      <PostLink
        postId={item.id}
        paused={paused}
        post={item}
        width={layout.width}
        author={item.author}
        small
        muted
        style={[layout, { position: 'absolute', backgroundColor: 'white' }]}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id, paused, windowWidth],
  );

// fraction of the scroll height that trigger a relayout
const BATCH_SIZE = 4;
