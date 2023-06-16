import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import PostLink from '#components/PostLink';
import { createId } from '#helpers/idHelpers';
import useScrollToTopInterceptor from '#hooks/useScrollToTopInterceptor/useScrollToTopInterceptor.ios';
import type {
  PostsGrid_posts$data,
  PostsGrid_posts$key,
} from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';

type PostsGrid = {
  posts: PostsGrid_posts$key;
  canPlay?: boolean;
  refreshing?: boolean;
  maxVideos?: number;
  ListHeaderComponent?: ReactNode;
  ListFooterComponent?: ReactNode;
  stickyHeaderIndices?: number[] | undefined;
  onReady?: () => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onScroll?: (scrollPosition: number) => void;
  style?: StyleProp<ViewStyle>;
  postsContainerStyle?: StyleProp<ViewStyle>;
  nestedScrollEnabled?: boolean;
};

// This is an attemps to Use recycling for post list with custom layout
// Since the layout can be predetermined we remove and add elements depending of the scroll position
// and maintains a pool of key to avoid recreating native view

// TODO docs and tests once this component is production ready
const PostsGrid = ({
  posts: postsKey,
  canPlay,
  refreshing,
  maxVideos = Platform.select({ android: 2, default: 3 }),
  ListHeaderComponent,
  ListFooterComponent,
  stickyHeaderIndices,
  onReady,
  onRefresh,
  onEndReached,
  onScroll: onScrollCallback,
  style,
  postsContainerStyle,
  nestedScrollEnabled = false,
}: PostsGrid) => {
  const posts = useFragment(
    graphql`
      fragment PostsGrid_posts on Post @relay(plural: true) {
        id
        ...PostRendererFeedFragment_post
        media {
          __typename
          aspectRatio
        }
      }
    `,
    postsKey,
  );

  const [layoutPosition, setLayoutPosition] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [headerSize, setHeaderSize] = useState(0);
  const [isScrollingToTop, setIsScrollingToTop] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const [contentHeight, postsMap] = useMemo(() => {
    if (!scrollViewHeight) {
      return [
        0,
        new Map<string, { item: Post; layout: ItemLayout; isVideo: boolean }>(),
      ];
    }
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
    const postsMap = new Map<
      string,
      { item: Post; layout: ItemLayout; isVideo: boolean }
    >();

    let currentPositionLeft = offsetTop;
    let currentPositionRight = offsetTop;

    const pageSize = 1.75 * scrollViewHeight;
    const videosDistance = pageSize / maxVideos;

    let lastVideoPosition = 0;

    let videos: number[] = [];
    for (const post of posts) {
      videos = videos.sort((a, b) => a - b);

      const isOnLeft = currentPositionLeft <= currentPositionRight;
      const height = itemWidth / post.media.aspectRatio;

      let isVideo = post.media.__typename === 'MediaVideo';

      if (
        isVideo &&
        (videos.length < maxVideos ||
          (currentPositionLeft - videos[0] > videosDistance &&
            currentPositionRight - videos[0] > videosDistance))
      ) {
        lastVideoPosition =
          (isOnLeft ? currentPositionLeft : currentPositionRight) + height;
        if (videos.length === maxVideos) {
          videos.shift();
        }

        videos.push(lastVideoPosition);
      } else {
        isVideo = false;
      }

      postsMap.set(post.id, {
        item: post,
        layout: {
          left: isOnLeft ? 8 : itemWidth + 16,
          top: isOnLeft ? currentPositionLeft : currentPositionRight,
          width: itemWidth,
          height,
        },
        isVideo,
      });

      if (isOnLeft) {
        currentPositionLeft += height + 8;
      } else {
        currentPositionRight += height + 8;
      }
    }

    const contentHeight =
      Math.max(currentPositionLeft, currentPositionRight) + offsetBottom;

    return [contentHeight, postsMap];
  }, [scrollViewHeight, postsContainerStyle, windowWidth, posts, maxVideos]);

  const onScrollStart = () => {
    clearTimeout(scrollEndTimeout.current);
    scrollEndTimeout.current = null;
    setIsScrolling(true);
  };

  const scrollEndTimeout = useRef<any>(null);

  const onScrollEnd = () => {
    if (scrollEndTimeout.current != null) {
      return;
    }
    scrollEndTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 500);
  };

  const onWillScrollToTop = () => {
    // TODO we would like to use batched updates, but it doesn't work on web
    setIsScrollingToTop(true);
    onScrollStart();
  };

  const onScroll = (scrollPosition: number) => {
    onScrollCallback?.(scrollPosition);
    if (contentHeight - scrollPosition < scrollViewHeight * 2) {
      onEndReached?.();
    }
    if (isScrollingToTop && scrollPosition === 0) {
      setIsScrollingToTop(false);
      onScrollEnd();
    }

    setLayoutPosition(
      Math.floor(
        (Math.max(scrollPosition - headerSize, 0) * BATCH_SIZE) /
          scrollViewHeight,
      ) / BATCH_SIZE,
    );
  };

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

    for (const post of posts) {
      const data = postsMap.get(post.id);
      if (!data) {
        break;
      }
      const { item, layout, isVideo } = data;
      if (layout.top >= topLimit && layout.top < bottomLimit) {
        const freeKeys = isVideo ? freeVideoKeysMap : freeImageKeysMap;
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
      // eslint-disable-next-line prefer-const
      let [id, key] = items[i];
      const data = postsMap.get(id);
      if (!data) {
        break;
      }
      const { item, isVideo } = data;
      if (!key) {
        const freeKeys = isVideo ? freeVideoKeys : freeImageKeys;
        const usedKeys = isVideo ? videosKeys : imagesKeys;
        const entry = freeKeys.pop();
        if (entry) {
          key = entry[1];
          usedKeys.delete(entry[0]);
        } else {
          key = createId();
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
  }, [isScrollingToTop, layoutPosition, posts, postsMap, scrollViewHeight]);
  itemRefs.current = items;

  const placeHolders = useMemo(
    () =>
      posts.map(({ id }) => {
        if (!postsMap.has(id)) {
          return null;
        }
        const { item, layout } = postsMap.get(id)!;
        return (
          <View key={item.id} style={[layout, { position: 'absolute' }]}>
            <View
              style={{
                width: layout.width,
                height: layout.width / item.media.aspectRatio,
                borderRadius: 16,
                backgroundColor: colors.grey100,
              }}
            />
          </View>
        );
      }),
    [posts, postsMap],
  );

  const readyDisplayed = useRef(false);
  const nbPostReady = useRef(0);
  const onPostReady = useCallback(() => {
    if (readyDisplayed.current) {
      return;
    }
    nbPostReady.current++;
    if (nbPostReady.current >= itemRefs.current.length) {
      readyDisplayed.current = true;
      onReady?.();
    }
  }, [onReady]);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollToTopInterceptor = useScrollToTopInterceptor(() => {
    if (scrollViewRef.current) {
      onWillScrollToTop?.();
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  });

  const scrollViewRefCallback = useCallback(
    (ref: ScrollView | null) => {
      scrollToTopInterceptor(ref);
      scrollViewRef.current = ref;
    },
    [scrollToTopInterceptor],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setScrollViewHeight?.(e.nativeEvent.layout.height);
  };

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderSize?.(e.nativeEvent.layout.height);
  };

  return (
    <ScrollView
      accessibilityRole="list"
      testID="post-grid-container"
      nestedScrollEnabled={nestedScrollEnabled}
      ref={scrollViewRefCallback}
      style={style}
      stickyHeaderIndices={stickyHeaderIndices}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
        />
      }
      scrollEventThrottle={16}
      onScroll={e => onScroll?.(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={onScrollStart}
      onMomentumScrollEnd={onScrollEnd}
      onLayout={onLayout}
    >
      {ListHeaderComponent && (
        <View onLayout={onHeaderLayout}>{ListHeaderComponent}</View>
      )}
      <View
        style={[{ height: contentHeight, width: '100%' }, postsContainerStyle]}
      >
        <View style={StyleSheet.absoluteFill} />
        <View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: isScrolling ? 1 : 0,
            },
          ]}
        >
          {placeHolders}
        </View>
        {items.map(([id, key]) => {
          const data = postsMap.get(id);
          if (!data) {
            console.warn('null data for id ' + id);
            return null;
          }
          return (
            <MemoPostRenderer
              key={key}
              item={data.item}
              videoDisabled={!data.isVideo || !canPlay}
              windowWidth={windowWidth}
              layout={data.layout}
              paused={!canPlay}
              onReady={onPostReady}
            />
          );
        })}
      </View>
      {ListFooterComponent}
    </ScrollView>
  );
};

export default PostsGrid;

type Post = ArrayItemType<PostsGrid_posts$data>;
export type ItemLayout = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const MemoPostRenderer = ({
  item,
  layout,
  windowWidth,
  paused,
  videoDisabled,
  onReady,
}: {
  item: Post;
  paused?: boolean;
  videoDisabled?: boolean;
  windowWidth: number;
  layout: ItemLayout;
  onReady?: () => void;
}) =>
  useMemo(
    () => (
      <PostLink
        postId={item.id}
        paused={paused}
        post={item}
        width={layout.width}
        videoDisabled={videoDisabled}
        muted
        style={[layout, { position: 'absolute' }]}
        onReady={onReady}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id, paused, videoDisabled, windowWidth],
  );

// fraction of the scroll height that trigger a relayout
const BATCH_SIZE = 4;
