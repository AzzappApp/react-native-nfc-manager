import { MasonryFlashList } from '@shopify/flash-list';
import { isEqual } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  Platform,
  useWindowDimensions,
  RefreshControl,
  View,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostLink from '#components/PostLink';
import { keyExtractor } from '#helpers/idHelpers';
import type {
  PostsGrid_posts$data,
  PostsGrid_posts$key,
} from '#relayArtifacts/PostsGrid_posts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import type {
  StyleProp,
  ViewabilityConfig,
  ViewStyle,
  ViewToken,
} from 'react-native';

type PostsGrid = {
  posts: PostsGrid_posts$key;
  canPlay?: boolean;
  refreshing?: boolean;
  maxVideos?: number;
  ListHeaderComponent?: ReactElement<any> | null;
  ListFooterComponent?: ReactElement<any> | null;
  onRefresh?: () => void;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  nestedScrollEnabled?: boolean;
  extraData?: any;
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
  onRefresh,
  onEndReached,
  style,
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

  const [videoToPlays, setVideoToPlays] = useState<string[]>([]);

  //# region viewable to handle video preview
  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: Array<ViewToken<Post>>; changed: ViewToken[] }) => {
      //we can only have two Item
      const viewableRows = info.viewableItems.filter(item => item.isViewable);
      const videoViewable = viewableRows
        .filter(({ item }) => item.media.__typename === 'MediaVideo')
        .map(({ item }) => item.id);

      setVideoToPlays(videoToPlays => {
        const newVideoToPlays = videoToPlays.filter(id =>
          videoViewable.includes(id),
        );
        let i = 0;
        while (newVideoToPlays.length < maxVideos && i < videoViewable.length) {
          const id = videoViewable[i];
          if (!newVideoToPlays.includes(id)) {
            newVideoToPlays.push(id);
          }
          i++;
        }
        return isEqual(newVideoToPlays, videoToPlays)
          ? videoToPlays
          : newVideoToPlays;
      });
    },
    [maxVideos],
  );

  const refreshControl = useMemo(() => {
    return (
      <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
    );
  }, [refreshing, onRefresh]);

  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = (windowWidth - 24) / 2;

  const extraData = useMemo(
    () => ({ itemWidth, videoToPlays, canPlay }),
    [itemWidth, videoToPlays, canPlay],
  );

  return (
    <MasonryFlashList
      data={posts}
      numColumns={2}
      accessibilityRole="list"
      testID="post-grid-container"
      nestedScrollEnabled={nestedScrollEnabled}
      style={style}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={itemWidth}
      refreshing={refreshing}
      refreshControl={refreshControl}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={contentContainerStyle}
      optimizeItemArrangement
      overrideItemLayout={overrideItemLayout}
      extraData={extraData}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      getItemType={getItemType}
    />
  );
};

const renderItem = ({
  item,
  extraData: { itemWidth, canPlay, videoToPlays },
}: ListRenderItemInfo<Post>) => {
  return (
    <MemoPostRenderer
      item={item}
      width={itemWidth}
      videoDisabled={!canPlay || !videoToPlays.includes(item.id)}
    />
  );
};

const viewabilityConfig: ViewabilityConfig = {
  minimumViewTime: 500,
  itemVisiblePercentThreshold: 100,
  waitForInteraction: false,
};

const overrideItemLayout = (
  layout: { span?: number; size?: number },
  item: Post,
  _index: number,
  _maxColumns: number,
  extraData?: any,
) => {
  const itemWidth = extraData.itemWidth;
  const ratio = item.media?.aspectRatio ?? 1;
  layout.size = itemWidth / ratio;
};

export default PostsGrid;

// allow to prevent blanking when scroll to top see: https://github.com/Shopify/flash-list/issues/76#issuecomment-1257642374
const getItemType = (_: any, index: number) => {
  if (Platform.OS === 'ios' && index < 10) {
    return index + 1;
  }
};

const contentContainerStyle = { paddingHorizontal: 8 };

const ItemSeparator = () => <View style={{ height: 8, width: 8 }} />;

type Post = ArrayItemType<PostsGrid_posts$data>;

const PostRenderer = ({
  item,
  width,
  videoDisabled,
}: {
  item: Post;
  videoDisabled?: boolean;
  width: number;
}) => {
  const ratio = item.media?.aspectRatio ?? 1;
  return (
    <PostLink
      postId={item.id}
      post={item}
      width={width}
      style={{ width, aspectRatio: ratio }}
      videoDisabled={videoDisabled}
      muted
    />
  );
};

const MemoPostRenderer = memo(PostRenderer);
