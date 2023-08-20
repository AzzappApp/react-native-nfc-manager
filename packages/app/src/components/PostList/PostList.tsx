import { FlashList } from '@shopify/flash-list';
import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostRenderer from '#components/PostList/PostRenderer';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import { PostListContext } from './PostListsContext';
import type {
  PostList_posts$data,
  PostList_posts$key,
} from '@azzapp/relay/artifacts/PostList_posts.graphql';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { ViewProps, ViewToken } from 'react-native';

type PostListProps = ViewProps & {
  posts: PostList_posts$key;
  author?: PostRendererFragment_author$key;
  canPlay?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
};

// TODO docs and tests once this component is production ready
const PostList = ({
  posts: postKey,
  author,
  canPlay = true,
  refreshing = false,
  loading = false,
  onEndReached,
  onRefresh,
  ...props
}: PostListProps) => {
  const posts = useFragment(
    graphql`
      fragment PostList_posts on Post
      @relay(plural: true)
      @argumentDefinitions(
        includeAuthor: { type: "Boolean!", defaultValue: false }
      ) {
        id
        media {
          id
          __typename
        }
        ...PostRendererFragment_post
        author @include(if: $includeAuthor) {
          ...PostRendererFragment_author
        }
      }
    `,
    postKey,
  );

  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      const videoIds = info.viewableItems
        .filter(
          viewToken =>
            viewToken.item.media?.__typename === 'MediaVideo' &&
            viewToken.isViewable,
        )
        .map(viewToken => {
          return { id: viewToken.item.id, index: viewToken.index };
        });

      //arbitrary limit of 1 video playing during postlist, arbitrary choosing the id
      if (videoIds.length > 0) {
        //we need to make a specia case for the first and last video which could not be view depeding on configuration
        //look for index 0 and last index
        if (videoIds[0].index === 0) {
          setVisiblePostIds([videoIds[0].id]);
        } else if (videoIds[videoIds.length - 1].index === posts.length - 1) {
          setVisiblePostIds([videoIds[videoIds.length - 1].id]);
        } else {
          setVisiblePostIds([videoIds[0].id]);
        }
      } else {
        setVisiblePostIds([]);
      }
    },
    [posts.length],
  );

  const { width: windowWidth } = useWindowDimensions();
  const renderItem = useCallback(
    ({ item, extraData }: ListRenderItemInfo<Post>) => {
      return (
        <PostRenderer
          post={item}
          videoDisabled={!extraData.canPlay}
          width={windowWidth}
          author={item.author ?? author!}
        />
      );
    },
    [author, windowWidth],
  );

  return (
    <PostListContext.Provider value={{ visibleVideoPostIds: visiblePostIds }}>
      <FlashList<Post>
        data={posts}
        renderItem={renderItem}
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={<ListLoadingFooter loading={loading} />}
        estimatedItemSize={300}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReachedThreshold={1}
        extraData={{ canPlay }}
        viewabilityConfig={{
          //TODO: improve this with review of tester
          itemVisiblePercentThreshold: 60,
        }}
        {...props}
      />
    </PostListContext.Provider>
  );
};

export default PostList;

type Post = ArrayItemType<PostList_posts$data>;
