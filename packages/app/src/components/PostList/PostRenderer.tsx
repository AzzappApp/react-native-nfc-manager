import {
  Suspense,
  forwardRef,
  memo,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';

import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import useToggle from '#hooks/useToggle';
import IconButton from '#ui/IconButton';

import { PostListContext } from './PostListsContext';
import PostRendererBottomPanel, {
  PostRendererBottomPanelSkeleton,
} from './PostRendererBottomPanel';
import PostRendererMedia from './PostRendererMedia';
import type { MediaVideoRendererHandle } from '#components/medias';
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
   *  ths post author
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
   * iniital time of the video
   *
   * @type {(number | null)}
   */
  initialTime?: number | null;
};

export type PostRendererHandle = {
  getCurrentMediaRenderer(): HostComponent<any> | null;
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
      fragment PostRendererFragment_author on Profile {
        ...AuthorCartoucheFragment_profile
        ...PostRendererBottomPanelFragment_author
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
      getCurrentMediaRenderer() {
        if (!mediaRef.current) {
          return null;
        }
        if ('getContainer' in mediaRef.current) {
          return mediaRef.current.getContainer();
        } else {
          return mediaRef.current;
        }
      },
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
  const [showModal, toggleModal] = useToggle();
  const context = useContext(PostListContext);
  const shouldPlayVideo = context.visibleVideoPostIds.includes(post.id);

  return (
    <View {...props}>
      <View style={styles.headerView}>
        <AuthorCartouche
          author={author}
          style={styles.authorCartoucheStyle}
          activeLink
        />

        <IconButton
          variant="icon"
          icon="more"
          onPress={toggleModal}
          style={{ marginRight: 20 }}
        />
      </View>
      <View style={[styles.mediaContainer]}>
        <PostRendererMedia
          post={post}
          width={width}
          muted={muted}
          paused={paused || !shouldPlayVideo}
          initialTime={initialTime}
          videoDisabled={videoDisabled}
        />
      </View>
      <Suspense fallback={<PostRendererBottomPanelSkeleton />}>
        <PostRendererBottomPanel
          toggleModal={toggleModal}
          showModal={showModal}
          author={author}
          post={post}
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
