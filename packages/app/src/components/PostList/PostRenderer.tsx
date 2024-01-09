import {
  Suspense,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';

import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import useAuthState from '#hooks/useAuthState';
import useToggle from '#hooks/useToggle';
import IconButton from '#ui/IconButton';

import { PostListContext } from './PostListsContext';
import PostRendererBottomPanel, {
  PostRendererBottomPanelSkeleton,
} from './PostRendererBottomPanel';
import PostRendererMedia from './PostRendererMedia';
import type { MediaVideoRendererHandle } from '#components/medias';
import type { PostRendererBottomPanel_webCard$key } from '@azzapp/relay/artifacts/PostRendererBottomPanel_webCard.graphql';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { PostRendererFragment_post$key } from '@azzapp/relay/artifacts/PostRendererFragment_post.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps, HostComponent } from 'react-native';

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
   *  the viewer webcard
   *
   * @type {PostRendererFragment_author$key}
   */
  webCardKey?: PostRendererBottomPanel_webCard$key;
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
   * initial time of the video
   *
   * @type {(number | null)}
   */
  initialTime?: number | null;

  /**
   * callback when the author cartouche is pressed
   */
  onPressAuthor?: () => void;
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
    webCardKey,
    width,
    muted = false,
    videoDisabled = false,
    paused = false,
    initialTime,
    onPressAuthor,
    ...props
  }: PostRendererProps,
  forwardedRef: ForwardedRef<PostRendererHandle>,
) => {
  const post = useFragment(
    graphql`
      fragment PostRendererFragment_post on Post {
        id
        ...PostRendererBottomPanelFragment_post
        ...PostRendererMediaFragment_post
        ...PostRendererActionBar_post
      }
    `,
    postKey,
  );

  const author = useFragment(
    graphql`
      fragment PostRendererFragment_author on WebCard {
        ...AuthorCartoucheFragment_webCard
      }
    `,
    authorKey,
  );

  const mediaRef = useRef<HostComponent<any> | MediaVideoRendererHandle | null>(
    null,
  );

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

  const { profileRole } = useAuthState();

  const [showModal, toggleModal] = useToggle();
  const context = useContext(PostListContext);
  const shouldPlayVideo = context.played === post.id;
  const shouldPauseVideo = context.paused.includes(post.id) && !shouldPlayVideo;

  const intl = useIntl();

  const openModal = useCallback(() => {
    if (profileRole && isEditor(profileRole)) {
      toggleModal();
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins can edit a post',
          description:
            'Error message when a user tries to edit a post but is not an admin',
        }),
      });
    }
  }, [intl, profileRole, toggleModal]);

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
          onPress={openModal}
          style={{ marginRight: 20 }}
        />
      </View>
      <View style={styles.mediaContainer}>
        <PostRendererMedia
          post={post}
          width={width}
          muted={muted}
          paused={paused || !shouldPlayVideo}
          initialTime={initialTime}
          videoDisabled={
            videoDisabled || (!shouldPlayVideo && !shouldPauseVideo)
          }
        />
      </View>
      <Suspense fallback={<PostRendererBottomPanelSkeleton />}>
        <PostRendererBottomPanel
          toggleModal={openModal}
          showModal={showModal}
          post={post}
          webCardKey={webCardKey}
        />
      </Suspense>
    </View>
  );
};

export default memo(forwardRef(PostRenderer));

const styles = StyleSheet.create({
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
});
