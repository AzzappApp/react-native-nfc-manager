import { MasonryFlashList } from '@shopify/flash-list';
import isEqual from 'lodash/isEqual';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Platform,
  useWindowDimensions,
  RefreshControl,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import PostLink from '#components/PostLink';
import Skeleton from '#components/Skeleton';
import { keyExtractor } from '#helpers/idHelpers';
import useToggleLikePost from '#hooks/useToggleLikePost';
import { POST_RENDERER_RADIUS } from './PostRendererFeed';
import type {
  PostsGrid_posts$data,
  PostsGrid_posts$key,
} from '#relayArtifacts/PostsGrid_posts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { MasonryListRenderItemInfo } from '@shopify/flash-list';
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
  webcardId?: string;
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

  const videoToPlaysRef = useRef<string[]>([]);
  //# region viewable to handle video preview
  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: Array<ViewToken<Post>>; changed: ViewToken[] }) => {
      //we can only have two Item
      const viewableRows = info.viewableItems.filter(item => item.isViewable);
      const videoViewable = viewableRows
        .filter(({ item }) => item.media.__typename === 'MediaVideo')
        .map(({ item }) => item.id);

      const currentVideoToPlays = videoToPlaysRef.current;
      const newVideoToPlays = currentVideoToPlays.filter(id =>
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
      videoToPlaysRef.current = isEqual(newVideoToPlays, currentVideoToPlays)
        ? currentVideoToPlays
        : newVideoToPlays;
    },
    [maxVideos],
  );

  const onMomentumScrollEnd = useCallback(() => {
    setVideoToPlays(videoToPlaysRef.current);
  }, []);

  const refreshControl = useMemo(() => {
    return (
      <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
    );
  }, [refreshing, onRefresh]);

  const { width: windowWidth } = useWindowDimensions();

  const extraData = useMemo(
    () => ({ itemWidth: (windowWidth - 24) / 2, videoToPlays, canPlay }),
    [windowWidth, videoToPlays, canPlay],
  );

  return (
    <MasonryFlashList
      data={posts}
      numColumns={2}
      accessibilityRole="list"
      testID="post-grid-container"
      nestedScrollEnabled={nestedScrollEnabled}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={167}
      refreshing={!!refreshing}
      refreshControl={refreshControl}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      optimizeItemArrangement
      overrideItemLayout={overrideItemLayout}
      extraData={extraData}
      viewabilityConfig={viewabilityConfig}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onViewableItemsChanged={onViewableItemsChanged}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      getItemType={getItemType}
    />
  );
};

const renderItem = ({
  item,
  columnIndex,
  extraData: { itemWidth, canPlay, videoToPlays },
}: MasonryListRenderItemInfo<Post | null>) => {
  return (
    item && (
      <View
        style={[
          columnIndex === 0
            ? { paddingLeft: 8, paddingRight: 4 }
            : { paddingLeft: 4, paddingRight: 8 },
          { paddingBottom: 8 },
        ]}
      >
        <MemoPostRenderer
          item={item}
          width={itemWidth}
          videoDisabled={!canPlay || !videoToPlays.includes(item.id)}
        />
      </View>
    )
  );
};

const viewabilityConfig: ViewabilityConfig = {
  minimumViewTime: 500,
  itemVisiblePercentThreshold: 100,
  waitForInteraction: false,
};

const overrideItemLayout = (
  layout: { span?: number; size?: number },
  item: Post | null,
  _index: number,
  _maxColumns: number,
  extraData?: any,
) => {
  const itemWidth = extraData.itemWidth;
  const ratio = item?.media?.aspectRatio ?? 1;
  layout.size = itemWidth / ratio + 8;
};

export default PostsGrid;

const getItemType = (post: Post | null, index: number) => {
  // allow to prevent blanking when scroll to top see: https://github.com/Shopify/flash-list/issues/76#issuecomment-1257642374
  if (Platform.OS === 'ios' && index < 10) {
    return 'fixed';
  }
  if (post?.media?.__typename === 'MediaVideo') {
    return 'video';
  } else {
    return 'image';
  }
};

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
  const intl = useIntl();
  const ratio = item.media?.aspectRatio ?? 1;
  const toggleLikePost = useToggleLikePost({
    onCompleted(response) {
      if (response?.togglePostReaction.post.postReaction) {
        Toast.show({
          type: 'like',
          text1: intl.formatMessage({
            defaultMessage: 'liked',
            description: 'Toggle like post success in post grid',
          }) as unknown as string,
        });
      } else {
        Toast.show({
          type: 'unlike',
          text1: intl.formatMessage({
            defaultMessage: 'unliked',
            description: 'Toggle unlike post success in post grid',
          }) as unknown as string,
        });
      }
    },
  });

  const onToggleLikePost = () => {
    toggleLikePost(item.id);
  };

  return (
    <PostLink
      onLike={onToggleLikePost}
      postId={item.id}
      post={item}
      width={width}
      style={{
        width,
        aspectRatio: ratio,
      }}
      videoDisabled={videoDisabled}
      muted
    />
  );
};

const MemoPostRenderer = memo(PostRenderer);

export const PostGridFallback = () => {
  const itemsLeft = [1.5, 0.4, 1, 2, 0.625, 0.7];
  const itemsRight = [0.8, 1.2, 1.6, 0.3, 1.1, 2];
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 8, gap: 8 }}>
      <View style={{ gap: 8, flex: 1 }}>
        {itemsLeft.map((ratio, index) => (
          <Skeleton
            key={index}
            style={{
              aspectRatio: ratio,
              borderRadius: POST_RENDERER_RADIUS,
            }}
          />
        ))}
      </View>
      <View style={{ gap: 8, flex: 1 }}>
        {itemsRight.map((ratio, index) => (
          <Skeleton
            key={index}
            style={{
              aspectRatio: ratio,
              borderRadius: POST_RENDERER_RADIUS,
            }}
          />
        ))}
      </View>
    </View>
  );
};
