import {
  Suspense,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useIntl } from 'react-intl';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import useBoolean from '#hooks/useBoolean';
import useToggleLikePost from '#hooks/useToggleLikePost';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';

import PressableNative from '#ui/PressableNative';
import { PostListContext } from './PostListsContext';
import PostRendererBottomPanel, {
  PostRendererBottomPanelSkeleton,
} from './PostRendererBottomPanel';
import PostRendererMedia from './PostRendererMedia';
import type {
  MediaVideoRendererHandle,
  MediaImageRendererHandle,
} from '#components/medias';
import type { PostRendererFragment_author$key } from '#relayArtifacts/PostRendererFragment_author.graphql';
import type { PostRendererFragment_post$key } from '#relayArtifacts/PostRendererFragment_post.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

export type PostRendererProps = ViewProps & {
  /**
   * the post
   *
   * @type {PostRendererFragment_post$key}
   */
  post: PostRendererFragment_post$key;
  /**
   *  the post author
   *
   * @type {PostRendererFragment_author$key}
   */
  author: PostRendererFragment_author$key;
  /**
   *
   *
   * @type {number}
   */
  width: number;
  /**
   * are video muted
   *
   * @type {boolean}
   */
  muted?: boolean;
  /**
   * are video disabled
   * @type {boolean}
   */
  videoDisabled?: boolean;
  /**
   * are video pause
   *
   * @type {boolean}
   */
  paused?: boolean;
  /**
   * If true, and if a snapshot of the post media exists, it will be while loading the media
   *
   * @type {boolean}
   */
  useAnimationSnapshot?: boolean;
  /**
   * initial time of the video
   *
   * @type {(number | null)}
   */
  initialTime?: number | null;

  /**
   * callback when the author cartouche is pressed
   */
  onPressAuthor?: () => void;

  actionEnabled?: boolean;

  onActionDisabled?: () => void;

  showUnpublished?: boolean;

  onDeleted?: () => void;
};

export type PostRendererHandle = {
  getCurrentVideoTime(): Promise<number | null>;
  snapshot(): Promise<void>;
};

// TODO docs and tests once this component is production ready
const PostRenderer = (
  {
    post: postKey,
    author: authorKey,
    width,
    muted = false,
    videoDisabled = false,
    paused = false,
    initialTime,
    onPressAuthor,
    actionEnabled = true,
    onActionDisabled,
    showUnpublished = false,
    useAnimationSnapshot,
    onDeleted,
    ...props
  }: PostRendererProps,
  forwardedRef: ForwardedRef<PostRendererHandle>,
) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
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
  const post = useFragment(
    graphql`
      fragment PostRendererFragment_post on Post
      @argumentDefinitions(viewerWebCardId: { type: "ID!" }) {
        id
        ...PostRendererBottomPanelFragment_post
          @arguments(viewerWebCardId: $viewerWebCardId)
        ...PostRendererMediaFragment_post
        ...PostRendererActionBar_post
          @arguments(viewerWebCardId: $viewerWebCardId)
        webCard {
          id
        }
      }
    `,
    postKey,
  );

  const author = useFragment(
    graphql`
      fragment PostRendererFragment_author on WebCard {
        id
        cardIsPublished
        ...AuthorCartoucheFragment_webCard
      }
    `,
    authorKey,
  );

  const mediaRef = useRef<
    MediaImageRendererHandle | MediaVideoRendererHandle | null
  >(null);

  useImperativeHandle(
    forwardedRef,
    () => ({
      async getCurrentVideoTime() {
        if (mediaRef.current && 'getPlayerCurrentTime' in mediaRef.current) {
          return mediaRef.current.getPlayerCurrentTime();
        }
        return null;
      },
      async snapshot() {
        if (mediaRef.current && 'snapshot' in mediaRef.current) {
          await mediaRef.current.snapshot();
        }
      },
    }),
    [],
  );

  const [showModal, openModal, closeModal] = useBoolean(false);
  const context = useContext(PostListContext);
  const shouldPlayVideo = context.played === post.id;
  const shouldPauseVideo = context.paused.includes(post.id) && !shouldPlayVideo;

  const safeOpenModal = useCallback(() => {
    const { profileInfos } = getAuthState();
    if (profileInfoHasEditorRight(profileInfos)) {
      openModal();
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when a user tries to edit a post but is not an admin',
        }),
      });
    }
  }, [intl, openModal]);

  const handleOpenModal = useCallback(() => {
    if (!actionEnabled) {
      onActionDisabled?.();
      return;
    }
    safeOpenModal();
  }, [actionEnabled, onActionDisabled, safeOpenModal]);

  const handleCloseModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const showUnpublishedOverlay = useMemo(() => {
    if (showUnpublished) return false;
    else return !author.cardIsPublished;
  }, [author.cardIsPublished, showUnpublished]);

  const onToggleLikePost = () => {
    toggleLikePost(post.id);
  };

  return (
    <View {...props}>
      <View style={styles.headerView}>
        <AuthorCartouche
          author={author}
          style={styles.authorCartoucheStyle}
          activeLink
          onPress={onPressAuthor}
        />

        <IconButton
          variant="icon"
          icon="more"
          onPress={handleOpenModal}
          style={{ marginRight: 20 }}
        />
      </View>
      <View style={styles.mediaContainer}>
        {showUnpublishedOverlay ? (
          <View style={styles.unpublishedOverlay}>
            <Icon icon="bloc" size={48} style={styles.unpublishedIcon} />
          </View>
        ) : (
          <PressableNative
            style={styles.pressableStyle}
            onDoublePress={onToggleLikePost}
          >
            <PostRendererMedia
              post={post}
              width={width}
              muted={muted}
              paused={paused || !shouldPlayVideo}
              initialTime={initialTime}
              videoDisabled={
                videoDisabled || (!shouldPlayVideo && !shouldPauseVideo)
              }
              useAnimationSnapshot={useAnimationSnapshot}
            />
          </PressableNative>
        )}
      </View>
      {showModal && (
        <Suspense fallback={<PostRendererBottomPanelSkeleton />}>
          <PostRendererBottomPanel
            openModal={handleOpenModal}
            closeModal={handleCloseModal}
            showModal={showModal}
            post={post}
            actionEnabled={actionEnabled}
            onActionDisabled={onActionDisabled}
            onDeleted={onDeleted}
          />
        </Suspense>
      )}
    </View>
  );
};

export default memo(forwardRef(PostRenderer));

const styleSheet = createStyleSheet(appearance => ({
  headerView: { flexDirection: 'row', alignItems: 'center', height: 56 },
  pressableLink: { flex: 1 },
  authorCartoucheStyle: { marginLeft: 10, flex: 1 },
  mediaContainer: {
    backgroundColor: colors.grey100,
    overflow: 'hidden',
  },
  playIcon: {
    position: 'absolute',
    top: 10,
    end: 10,
    height: 24,
    width: 24,
  },
  mediaContainerSmall: {
    borderRadius: 16,
  },
  unpublishedOverlay: {
    width: '100%',
    aspectRatio: 3 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
  },
  unpublishedIcon: {
    tintColor: appearance === 'light' ? colors.grey100 : colors.grey900,
  },
  pressableStyle: { overflow: 'hidden' },
}));
