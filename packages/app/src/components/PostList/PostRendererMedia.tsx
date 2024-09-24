import { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { MediaImageRenderer, MediaVideoRenderer } from '#components/medias';
import Icon from '#ui/Icon';
import type {
  MediaVideoRendererHandle,
  MediaImageRendererHandle,
} from '#components/medias';
import type { PostRendererMediaFragment_post$key } from '#relayArtifacts/PostRendererMediaFragment_post.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

export type PostRendererMediaProps = ViewProps & {
  /**
   * the post
   *
   * @type {PostRendererFragment_post$key}
   */
  post: PostRendererMediaFragment_post$key;
  /**
   * if the post is small (used in the feed 2 column list)
   *
   * @type {boolean}
   */
  small?: boolean;
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
   * If true, and if a snapshot of the post media exists, it will be while loading the media
   *
   * @type {boolean}
   */
  useAnimationSnapshot?: boolean;
  /**
   * A callback that is called once the media is ready to be displayed.
   */
  onReady?: () => void;
};

// TODO docs and tests once this component is production ready
const PostRendererMedia = (
  {
    post: postKey,
    width,
    small,
    muted = false,
    videoDisabled = false,
    paused = false,
    initialTime,
    useAnimationSnapshot,
    onReady,
    ...props
  }: PostRendererMediaProps,
  forwardedRef: ForwardedRef<
    MediaImageRendererHandle | MediaVideoRendererHandle
  >,
) => {
  const post = useFragment(
    graphql`
      fragment PostRendererMediaFragment_post on Post
      @argumentDefinitions(
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
        postWith: { type: "Float!", provider: "PostWidth.relayprovider" }
        cappedPixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        videoPixelRatio: {
          type: "Float!"
          provider: "VideoPixelRatio.relayprovider"
        }
      ) {
        media {
          __typename
          id
          aspectRatio
          smallURI: uri(width: $postWith, pixelRatio: $cappedPixelRatio)
          ... on MediaImage {
            largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
          }
          ... on MediaVideo {
            largeThumbnail: thumbnail(
              width: $screenWidth
              pixelRatio: $pixelRatio
            )
            smallThumbnail: thumbnail(
              width: $postWith
              pixelRatio: $cappedPixelRatio
            )
            largeURI: uri(width: $screenWidth, pixelRatio: $videoPixelRatio)
          }
        }
      }
    `,
    postKey,
  );

  const {
    media: {
      __typename,
      id,
      aspectRatio,
      smallURI,
      largeURI,
      smallThumbnail,
      largeThumbnail,
    },
  } = post ?? { media: {} };

  const source = useMemo(
    () => ({
      uri: small ? smallURI : largeURI!,
      mediaId: id,
      requestedSize: width,
    }),
    [small, smallURI, largeURI, id, width],
  );

  const style = useMemo(
    () => ({
      aspectRatio,
    }),
    [aspectRatio],
  );

  if (!post) {
    return null;
  }

  return (
    <View {...props} style={styles.mediaContainer}>
      {__typename === 'MediaVideo' ? (
        <>
          <MediaVideoRenderer
            ref={forwardedRef as any}
            source={source}
            // TODO alt generation by cloudinary AI ? include text in small format ?
            alt={`This is a video posted`}
            thumbnailURI={small ? smallThumbnail : largeThumbnail}
            style={style}
            muted={muted}
            paused={paused}
            currentTime={initialTime}
            onReadyForDisplay={onReady}
            testID="PostRendererMedia_media"
            videoEnabled={!videoDisabled}
            useAnimationSnapshot={useAnimationSnapshot}
          />
          {videoDisabled ? <Icon icon="play" style={styles.playIcon} /> : null}
        </>
      ) : (
        <MediaImageRenderer
          ref={forwardedRef as any}
          source={source}
          // TODO alt generation by cloudinary AI ? include text in small format ?
          alt={`This is an image posted`}
          style={style}
          onReadyForDisplay={onReady}
          testID="PostRendererMedia_media"
          useAnimationSnapshot={useAnimationSnapshot}
        />
      )}
    </View>
  );
};

export default forwardRef(PostRendererMedia);

const styles = StyleSheet.create({
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
});
