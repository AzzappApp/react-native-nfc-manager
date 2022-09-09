import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, fontFamilies } from '../../theme';
import AuthorCartouche from './AuthorCartouche';
import Link from './Link';
import { MediaImageRenderer, MediaVideoRenderer } from './MediaRenderer';
import type { MediaVideoRendererHandle } from './MediaRenderer';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { PostRendererFragment_post$key } from '@azzapp/relay/artifacts/PostRendererFragment_post.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps, HostComponent } from 'react-native';

export type PostRendererProps = ViewProps & {
  post: PostRendererFragment_post$key;
  author: PostRendererFragment_author$key;
  small?: boolean;
  width: number;
  muted?: boolean;
  paused?: boolean;
  initialTime?: number | null;
};

export type PostRendererHandle = {
  getCurrentMediaRenderer(): HostComponent<any> | null;
  getCurrentVideoTime(): Promise<number | null>;
  snapshot(): Promise<void>;
};

const PostRenderer = (
  {
    post: postKey,
    author: authorKey,
    width,
    small,
    muted = false,
    paused = false,
    initialTime,
    ...props
  }: PostRendererProps,
  forwardedRef: ForwardedRef<PostRendererHandle>,
) => {
  const post = useFragment(
    graphql`
      fragment PostRendererFragment_post on Post
      @argumentDefinitions(
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
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
        id
        media {
          __typename
          source
          ratio
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            @include(if: $isNative)
          smallURI: uri(width: $postWith, pixelRatio: $cappedPixelRatio)
            @include(if: $isNative)
          ... on MediaVideo {
            largeThumbnail: thumbnail(
              width: $screenWidth
              pixelRatio: $pixelRatio
            ) @include(if: $isNative)
            smallThumbnail: thumbnail(
              width: $postWith
              pixelRatio: $cappedPixelRatio
            ) @include(if: $isNative)
          }
        }
        content
      }
    `,
    postKey,
  );

  const author = useFragment(
    graphql`
      fragment PostRendererFragment_author on User {
        id
        ...AuthorCartoucheFragment_user
        userName
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

  const {
    content,
    media: {
      __typename,
      ratio,
      source,
      smallURI,
      largeURI,
      smallThumbnail,
      largeThumbnail,
    },
  } = post;

  return (
    <View {...props}>
      {!small && (
        <Link route="USER" params={{ userName: author.userName }}>
          <AuthorCartouche author={author} />
        </Link>
      )}
      <View
        style={[styles.mediaContainer, small && styles.mediaContainerSmall]}
      >
        {__typename === 'MediaVideo' && (
          <MediaVideoRenderer
            ref={mediaRef as any}
            source={source}
            thumbnailURI={small ? smallThumbnail : largeThumbnail}
            uri={small ? smallURI : largeURI}
            aspectRatio={ratio}
            width={width}
            muted={muted}
            paused={paused}
            currentTime={initialTime}
          />
        )}
        {__typename === 'MediaImage' && (
          <MediaImageRenderer
            ref={mediaRef as any}
            source={source}
            uri={small ? smallURI : largeURI}
            aspectRatio={ratio}
            width={width}
          />
        )}
        {small && (
          <AuthorCartouche
            author={author}
            style={styles.smallAuthorCartouche}
            small
          />
        )}
      </View>
      {!small && !!content && <Text style={styles.text}>{content}</Text>}
    </View>
  );
};

export default forwardRef(PostRenderer);

const styles = StyleSheet.create({
  mediaContainer: {
    backgroundColor: colors.lightGrey,
    overflow: 'hidden',
  },
  mediaContainerSmall: {
    borderRadius: 16,
  },
  smallAuthorCartouche: {
    position: 'absolute',
    bottom: 5,
    left: 5,
  },
  text: {
    ...fontFamilies.semiBold,
    marginTop: 10,
    fontSize: 12,
    paddingHorizontal: 10,
  },
});
