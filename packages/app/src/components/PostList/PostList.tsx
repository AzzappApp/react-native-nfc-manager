import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, Dimensions, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import PostRenderer from '#components/PostList/PostRenderer';
import EmptyContent from '#components/ui/EmptyContent';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasAdminRight } from '#helpers/profileRoleHelper';
import { useProfileInfos } from '#hooks/authStateHooks';
import useScreenInsets from '#hooks/useScreenInsets';
import { HEADER_HEIGHT } from '#ui/Header';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import { PostListContext } from './PostListsContext';
import type { ScrollableToOffset } from '#helpers/types';
import type {
  PostList_posts$data,
  PostList_posts$key,
} from '#relayArtifacts/PostList_posts.graphql';
import type { PostRendererFragment_author$key } from '#relayArtifacts/PostRendererFragment_author.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ContentStyle, ListRenderItemInfo } from '@shopify/flash-list';
import type { MutableRefObject } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewProps,
  ViewToken,
} from 'react-native';

type PostListProps = ViewProps & {
  posts: PostList_posts$key;
  author?: PostRendererFragment_author$key;
  canPlay?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  contentContainerStyle?: ContentStyle;
  onPressAuthor?: () => void;
  showUnpublished?: boolean;
  firstItemVideoTime?: number | null;
  onPostDeleted?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  scrollableRef?: ScrollableToOffset;
};

const viewabilityConfig = {
  //TODO: improve this with review of tester
  itemVisiblePercentThreshold: 60,
};

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
// TODO docs and tests once this component is production ready
const PostList = ({
  posts: postKey,
  author: authorKey,
  canPlay = true,
  refreshing = false,
  loading = false,
  onEndReached,
  onRefresh,
  onPressAuthor,
  showUnpublished = false,
  firstItemVideoTime,
  onPostDeleted,
  onScroll,
  ListHeaderComponent,
  scrollableRef,
  ...props
}: PostListProps) => {
  const profileInfos = useProfileInfos();
  const posts = useFragment(
    graphql`
      fragment PostList_posts on Post
      @relay(plural: true)
      @argumentDefinitions(
        viewerWebCardId: { type: "ID!" }
        includeAuthor: { type: "Boolean!", defaultValue: false }
      ) {
        id
        media {
          id
          __typename
        }
        ...PostRendererFragment_post
          @arguments(viewerWebCardId: $viewerWebCardId)
        webCard @include(if: $includeAuthor) {
          ...PostRendererFragment_author
          ...PostList_author
        }
      }
    `,
    postKey,
  );

  const intl = useIntl();

  const author = useFragment(
    graphql`
      fragment PostList_author on WebCard {
        id
      }
    `,
    authorKey,
  );

  const postActionEnabled = useMemo(() => {
    const authState = getAuthState();
    if (authState.profileInfos?.cardIsPublished) {
      if (!authState.profileInfos?.invited) {
        //card is not published. We can do action only
        // if we are the owner and we are displaying his own list of post (author is provided)
        if (
          profileInfos &&
          profileInfoHasAdminRight(profileInfos) &&
          profileInfos.webCardId === author?.id
        ) {
          return true;
        }
        return !!authState.profileInfos?.cardIsPublished;
      }
      return false;
    } else {
      return false;
    }
  }, [author?.id, profileInfos]);

  const onActionDisabled = useCallback(() => {
    const authState = getAuthState();
    if (!authState.profileInfos?.cardIsPublished) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Unpublished WebCard.',
          description:
            'PostList - Alert Message title when the user is viewing a post (from deeplinking) with an unpublished WebCard',
        }),
        intl.formatMessage({
          defaultMessage:
            'This action can only be done from a published WebCard.',
          description:
            'PostList - AlertMessage when the user is viewing a post (from deeplinking) with an unpublished WebCard',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Ok',
              description:
                'PostList - Alert button when the user is viewing a post (from deeplinking) with an unpublished WebCard',
            }),
          },
        ],
      );
    }

    if (authState.profileInfos?.invited) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Invitation pending.',
          description:
            'PostList - Alert Message title when the user is viewing a post (from deeplinking) with an invited WebCard',
        }),
        intl.formatMessage({
          defaultMessage:
            'Oops, first you must accept the pending invitation to join the WebCard.',
          description:
            'PostList - AlertMessage when the user is viewing a post (from deeplinking) with an invited WebCard',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Ok',
              description:
                'PostList - Alert button when the user is viewing a post (from deeplinking) with an invited WebCard',
            }),
          },
        ],
      );
    }
  }, [intl]);

  const [visiblePostIds, setVisiblePostIds] = useState<{
    played: string | null;
    paused: string[];
  }>({ played: null, paused: [] });

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
        if (videoIds[videoIds.length - 1].index === posts.length - 1) {
          setVisiblePostIds(before =>
            before.played === videoIds[videoIds.length - 1].id
              ? before
              : {
                  played: videoIds[videoIds.length - 1].id,
                  paused: before.played
                    ? [before.played]
                    : before.paused.length > 1
                      ? before.paused.includes(videoIds[videoIds.length - 1].id)
                        ? before.paused.filter(
                            paused =>
                              paused !== videoIds[videoIds.length - 1].id,
                          )
                        : before.paused.slice(1)
                      : before.paused,
                },
          );
        } else {
          setVisiblePostIds(before =>
            before.played === videoIds[0].id
              ? before
              : {
                  played: videoIds[0].id,
                  paused: before.played
                    ? [before.played]
                    : before.paused.length > 1
                      ? before.paused.includes(videoIds[0].id)
                        ? before.paused.filter(
                            paused => paused !== videoIds[0].id,
                          )
                        : before.paused.slice(1)
                      : before.paused,
                },
          );
        }
      } else {
        setVisiblePostIds(before =>
          before.played === null
            ? before
            : {
                played: null,
                paused:
                  before.paused.length > 1
                    ? before.paused.slice(1).concat(before.played)
                    : before.paused.concat(before.played),
              },
        );
      }
    },
    [posts.length],
  );

  const renderItem = useCallback(
    ({ item, extraData, index }: ListRenderItemInfo<Post>) => {
      return item ? (
        <PostRenderer
          post={item}
          videoDisabled={!extraData.canPlay}
          width={windowWidth}
          onPressAuthor={onPressAuthor}
          author={item.webCard ?? extraData.authorKey!}
          actionEnabled={extraData.postActionEnabled}
          onActionDisabled={onActionDisabled}
          showUnpublished={extraData.showUnpublished}
          useAnimationSnapshot={index === 0}
          initialTime={index === 0 ? extraData.firstItemVideoTime : undefined}
          onDeleted={onPostDeleted}
        />
      ) : null;
    },
    [onActionDisabled, onPostDeleted, onPressAuthor],
  );

  const extraData = useMemo(
    () => ({
      canPlay,
      authorKey,
      firstItemVideoTime,
      postActionEnabled,
      showUnpublished,
    }),
    [
      canPlay,
      authorKey,
      postActionEnabled,
      firstItemVideoTime,
      showUnpublished,
    ],
  );

  const ListFooterComponent = useMemo(
    () => <ListLoadingFooter loading={loading} addBottomInset />,
    [loading],
  );

  useEffect(() => {
    if (posts.length > 0) {
      const item = [
        { index: 0, isViewable: true, item: posts[0], key: posts[0].id },
      ];
      onViewableItemsChanged({
        viewableItems: item,
        changed: item,
      });
    }
  }, [onViewableItemsChanged, posts]);

  return (
    <PostListContext.Provider value={visiblePostIds}>
      <FlashList
        ref={scrollableRef as MutableRefObject<FlashList<any>>}
        onScroll={onScroll}
        keyExtractor={keyExtractor}
        data={posts}
        renderItem={renderItem}
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        estimatedItemSize={300}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReachedThreshold={1}
        extraData={extraData}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={<PostListEmpty />}
        {...props}
      />
    </PostListContext.Provider>
  );
};

const PostListEmpty = () => {
  const insets = useScreenInsets();
  return (
    <View
      style={{
        height: windowHeight - HEADER_HEIGHT - insets.bottom - insets.top,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <EmptyContent
        message={
          <FormattedMessage
            defaultMessage="No posts yet"
            description="Empty post list message title"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Seems like there is no post on this feed..."
            description="Empty post list message content"
          />
        }
      />
    </View>
  );
};

const keyExtractor = (item: Post) => item.id;

export default PostList;

type Post = ArrayItemType<PostList_posts$data>;
