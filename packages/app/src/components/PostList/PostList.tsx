import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, Dimensions, useColorScheme, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import PostRenderer from '#components/PostList/PostRenderer';
import useScreenInsets from '#hooks/useScreenInsets';
import { HEADER_HEIGHT } from '#ui/Header';
import Icon from '#ui/Icon';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import Text from '#ui/Text';
import { PostListContext } from './PostListsContext';
import type {
  PostList_posts$data,
  PostList_posts$key,
} from '#relayArtifacts/PostList_posts.graphql';
import type { PostList_viewerProfile$key } from '#relayArtifacts/PostList_viewerProfile.graphql';
import type { PostList_viewerWebCard$key } from '#relayArtifacts/PostList_viewerWebCard.graphql';
import type { PostRendererFragment_author$key } from '#relayArtifacts/PostRendererFragment_author.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ContentStyle, ListRenderItemInfo } from '@shopify/flash-list';
import type { ViewProps, ViewToken } from 'react-native';

type PostListProps = ViewProps & {
  posts: PostList_posts$key;
  author?: PostRendererFragment_author$key;
  viewerWebCard?: PostList_viewerWebCard$key | null;
  profile?: PostList_viewerProfile$key;
  canPlay?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  contentContainerStyle?: ContentStyle;
  onPressAuthor?: () => void;
  showUnpublished?: boolean;
  firstItemVideoTime?: number | null;
};

const viewabilityConfig = {
  //TODO: improve this with review of tester
  itemVisiblePercentThreshold: 60,
};

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
// TODO docs and tests once this component is production ready
const PostList = ({
  posts: postKey,
  author,
  viewerWebCard: viewerWebCardKey,
  profile: profileKey,
  canPlay = true,
  refreshing = false,
  loading = false,
  onEndReached,
  onRefresh,
  onPressAuthor,
  showUnpublished = false,
  firstItemVideoTime,
  ...props
}: PostListProps) => {
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
        }
      }
    `,
    postKey,
  );

  const intl = useIntl();

  const viewerWebCard = useFragment(
    graphql`
      fragment PostList_viewerWebCard on WebCard {
        id
        cardIsPublished
      }
    `,
    viewerWebCardKey ?? null,
  );

  const viewerProfile = useFragment(
    graphql`
      fragment PostList_viewerProfile on Profile {
        id
        invited
      }
    `,
    profileKey ?? null,
  );

  const postActionEnabled = useMemo(
    () =>
      viewerWebCard?.cardIsPublished != null
        ? !viewerProfile?.invited
          ? !!viewerWebCard?.cardIsPublished
          : false
        : false,
    [viewerProfile?.invited, viewerWebCard?.cardIsPublished],
  );

  const onActionDisabled = useCallback(() => {
    if (!viewerWebCard?.cardIsPublished) {
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

    if (viewerProfile?.invited) {
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
  }, [intl, viewerProfile?.invited, viewerWebCard?.cardIsPublished]);

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
          author={item.webCard ?? extraData.author!}
          actionEnabled={extraData.postActionEnabled}
          onActionDisabled={onActionDisabled}
          showUnpublished={extraData.showUnpublished}
          useAnimationSnapshot={index === 0}
          initialTime={index === 0 ? extraData.firstItemVideoTime : undefined}
        />
      ) : null;
    },
    [onActionDisabled, onPressAuthor],
  );

  const extraData = useMemo(
    () => ({
      canPlay,
      author,
      firstItemVideoTime,
      postActionEnabled,
      showUnpublished,
    }),
    [canPlay, author, postActionEnabled, firstItemVideoTime, showUnpublished],
  );

  const ListFooterComponent = useMemo(
    () => <ListLoadingFooter loading={loading} />,
    [loading],
  );

  const colorScheme = useColorScheme();
  const insets = useScreenInsets();
  const ListEmptyComponent = useMemo(
    () => (
      <View
        style={{
          height: windowHeight - HEADER_HEIGHT - insets.bottom - insets.top,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ alignItems: 'center', width: 200 }}>
          <Icon
            style={{
              width: 60,
              height: 60,
              marginBottom: 20,
              tintColor:
                colorScheme === 'dark' ? colors.grey800 : colors.grey200,
            }}
            icon="empty"
          />
          <Text
            variant="xlarge"
            style={{ marginBottom: 10, textAlign: 'center' }}
          >
            <FormattedMessage
              defaultMessage="No posts yet"
              description="Empty post list message title"
            />
          </Text>
          <Text variant="medium" style={{ textAlign: 'center' }}>
            <FormattedMessage
              defaultMessage="Seems like there is no post on this feed..."
              description="Empty post list message content"
            />
          </Text>
        </View>
      </View>
    ),
    [colorScheme, insets.bottom, insets.top],
  );

  return (
    <PostListContext.Provider value={visiblePostIds}>
      <FlashList<Post>
        data={posts}
        renderItem={renderItem}
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={ListFooterComponent}
        estimatedItemSize={300}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReachedThreshold={1}
        extraData={extraData}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={ListEmptyComponent}
        {...props}
      />
    </PostListContext.Provider>
  );
};

export default PostList;

type Post = ArrayItemType<PostList_posts$data>;
