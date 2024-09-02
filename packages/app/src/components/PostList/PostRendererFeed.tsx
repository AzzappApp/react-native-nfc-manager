import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';

import PostRendererMedia from './PostRendererMedia';
import type { MediaVideoRendererHandle } from '#components/medias';
import type { MediaImageRendererHandle } from '#components/medias/MediaImageRenderer';
import type { PostRendererFeedFragment_post$key } from '#relayArtifacts/PostRendererFeedFragment_post.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

export type PostRendererFeedProps = ViewProps & {
  /**
   * the post
   *
   * @type {PostRendererMediaFragment_post$key}
   */
  post: PostRendererFeedFragment_post$key;
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
  /**
   * A callback that is called when the post media is ready to be displayed.
   */
  onReady?: () => void;
};

export type PostRendererFeedHandle = {
  getCurrentVideoTime(): Promise<number | null>;
  snapshot(): Promise<void>;
};

const PostRendererFeed = (
  {
    post: postKey,
    width,
    muted = false,
    videoDisabled = false,
    paused = false,
    initialTime,
    onReady,
    style,
    ...props
  }: PostRendererFeedProps,
  forwardedRef: ForwardedRef<PostRendererFeedHandle>,
) => {
  const post = useFragment(
    graphql`
      fragment PostRendererFeedFragment_post on Post {
        ...PostRendererMediaFragment_post
        webCard {
          ...AuthorCartoucheFragment_webCard
        }
      }
    `,
    postKey,
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
        if (mediaRef.current) {
          await mediaRef.current.snapshot();
        }
      },
    }),
    [],
  );

  return (
    <View {...props} style={[styles.mediaContainer, style]}>
      <PostRendererMedia
        small
        post={post}
        width={width}
        muted={muted}
        paused={paused}
        initialTime={initialTime}
        videoDisabled={videoDisabled}
        ref={mediaRef}
        onReady={onReady}
      />
      <AuthorCartouche
        author={post.webCard}
        style={styles.smallAuthorCartouche}
        variant="small"
      />
    </View>
  );
};

export default forwardRef(PostRendererFeed);

export const POST_RENDERER_RADIUS = 16;

const styles = StyleSheet.create({
  mediaContainer: {
    backgroundColor: colors.grey100,
    overflow: 'hidden',
    borderRadius: POST_RENDERER_RADIUS,
  },
  playIcon: {
    position: 'absolute',
    top: 10,
    end: 10,
    height: 24,
    width: 24,
  },
  smallAuthorCartouche: {
    position: 'absolute',
    bottom: 5,
    left: 5,
  },
  text: {
    fontSize: 12,
  },
});
