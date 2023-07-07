import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { MediaImageRenderer, MediaVideoRenderer } from '#components/medias';
import Icon from '#ui/Icon';
import type { MediaVideoRendererHandle } from '#components/medias';
import type { PostRendererMediaFragment_post$key } from '@azzapp/relay/artifacts/PostRendererMediaFragment_post.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps, HostComponent } from 'react-native';

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
   * iniital time of the video
   *
   * @type {(number | null)}
   */
  initialTime?: number | null;
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
    onReady,
    ...props
  }: PostRendererMediaProps,
  forwardedRef: ForwardedRef<HostComponent<any> | MediaVideoRendererHandle>,
) => {
  const post = useFragment(
    graphql`
      fragment PostRendererMediaFragment_post on Post
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        postWith: {
          type: "Float!"
          provider: "../providers/PostWidth.relayprovider"
        }
        cappedPixelRatio: {
          type: "Float!"
          provider: "../providers/CappedPixelRatio.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
      ) {
        media {
          __typename
          id
          aspectRatio
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
          smallURI: uri(width: $postWith, pixelRatio: $cappedPixelRatio)
          ... on MediaVideo {
            largeThumbnail: thumbnail(
              width: $screenWidth
              pixelRatio: $pixelRatio
            )
            smallThumbnail: thumbnail(
              width: $postWith
              pixelRatio: $cappedPixelRatio
            )
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
  } = post;

  return (
    <View {...props} style={styles.mediaContainer}>
      {__typename === 'MediaVideo' ? (
        videoDisabled ? (
          <>
            <MediaImageRenderer
              ref={forwardedRef as any}
              source={{
                uri: small ? smallThumbnail! : largeThumbnail!,
                mediaId: id,
                requestedSize: width,
              }}
              isVideo
              // TODO alt generation by cloudinary AI ? include text in small format ?
              alt={`This is an image posted`}
              aspectRatio={aspectRatio}
              onReadyForDisplay={onReady}
              testID="PostRendererMedia_media"
            />
            {/* Play iconicon */}
            <Icon icon="play" style={styles.playIcon} />
          </>
        ) : (
          <MediaVideoRenderer
            ref={forwardedRef as any}
            source={{
              uri: small ? smallURI : largeURI,
              mediaId: id,
              requestedSize: width,
            }}
            // TODO alt generation by cloudinary AI ? include text in small format ?
            alt={`This is a video posted`}
            thumbnailURI={small ? smallThumbnail : largeThumbnail}
            aspectRatio={aspectRatio}
            muted={muted}
            paused={paused}
            currentTime={initialTime}
            onReadyForDisplay={onReady}
            testID="PostRendererMedia_media"
          />
        )
      ) : (
        <MediaImageRenderer
          ref={forwardedRef as any}
          source={{
            uri: small ? smallURI : largeURI,
            mediaId: id,
            requestedSize: width,
          }}
          // TODO alt generation by cloudinary AI ? include text in small format ?
          alt={`This is an image posted`}
          aspectRatio={aspectRatio}
          onReadyForDisplay={onReady}
          testID="PostRendererMedia_media"
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
  text: {
    fontSize: 12,
  },
});
