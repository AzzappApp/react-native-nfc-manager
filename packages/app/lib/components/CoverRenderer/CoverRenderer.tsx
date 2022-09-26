import { COVER_BASE_WIDTH } from '@azzapp/shared/lib/cardHelpers';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import useInterval from '../../hooks/useInterval';
import ViewTransition from '../../ui/ViewTransition';
import { MediaImageRenderer, MediaVideoRenderer } from '../MediaRenderer';
import CoverLayout from './CoverLayout';
import type { MediaVideoRendererHandle } from '../MediaRenderer';
import type { CoverLayoutProps } from './CoverLayout';
import type { CoverRenderer_cover$key } from '@azzapp/relay/artifacts/CoverRenderer_cover.graphql';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

export type CoverRendererProps = Omit<
  CoverLayoutProps,
  'children' | 'cover'
> & {
  cover: CoverRenderer_cover$key | null | undefined;
  playTransition?: boolean;
  videoPaused?: boolean;
  imageIndex?: number;
  forceImageIndex?: boolean;
  initialVideosTimes?: { [index: number]: number | null | undefined } | null;
  onReadyForDisplay?: () => void;
};

export type CoverHandle = {
  getCurrentMediaRenderer(): HostComponent<any> | null;
  getCurrentImageIndex(): number;
  getCurrentVideoTime(): Promise<number | null>;
  snapshot(): Promise<void>;
};

const CoverRenderer = (
  {
    cover: coverKey,
    userName,
    width = 125,
    playTransition = true,
    videoPaused = false,
    imageIndex = 0,
    forceImageIndex,
    initialVideosTimes,
    onReadyForDisplay,
    ...props
  }: CoverRendererProps,
  forwardRef: ForwardedRef<CoverHandle>,
) => {
  /**
   * Data
   */
  const cover = useFragment(
    graphql`
      fragment CoverRenderer_cover on UserCardCover
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        cappedPixelRatio: {
          type: "Float!"
          provider: "../providers/CappedPixelRatio.relayprovider"
        }
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
      ) {
        pictures {
          __typename
          source
          ratio
          # since cover are mainly used with 2 size full screen and cover size
          # we preload those url to avoid unecessary round trip
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            @include(if: $isNative)
          smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            @include(if: $isNative)
          ... on MediaVideo {
            largeThumbnail: thumbnail(
              width: $screenWidth
              pixelRatio: $pixelRatio
            ) @include(if: $isNative)
            smallThumbnail: thumbnail(
              width: 125
              pixelRatio: $cappedPixelRatio
            ) @include(if: $isNative)
          }
        }
        pictureTransitionTimer
        ...CoverLayout_cover
      }
    `,
    coverKey ?? null,
  );

  /**
   * Handle image transition
   */
  const [currentImageIndex, setCurrentImageIndex] = useState(imageIndex);
  useEffect(() => {
    setCurrentImageIndex(imageIndex);
  }, [imageIndex]);

  useEffect(() => {
    if (forceImageIndex) {
      setCurrentImageIndex(imageIndex);
    }
  }, [imageIndex, forceImageIndex]);

  const nextIndex = () => {
    if (cover?.pictures.length) {
      const nextIndex = (currentImageIndex + 1) % cover.pictures.length;
      setCurrentImageIndex(nextIndex);
    }
  };

  const playInterval = (cover?.pictureTransitionTimer ?? 0) * 1000;
  useInterval(
    () => {
      if (cover?.pictures.length) {
        const currentPicture = cover.pictures[currentImageIndex];
        if (currentPicture.__typename === 'MediaImage') {
          nextIndex();
        }
      }
    },
    playTransition ? playInterval : 0,
  );

  const onVideoEnd = () => {
    nextIndex();
  };

  /**
   * Imperative Handle
   */
  const mediaRef = useRef<HostComponent<any> | MediaVideoRendererHandle | null>(
    null,
  );

  useImperativeHandle(
    forwardRef,
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
      getCurrentImageIndex() {
        return currentImageIndex;
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
    [currentImageIndex],
  );

  /**
   * Rendering
   */
  const { pictures = [] } = cover ?? {};

  const displayedPictures = playTransition
    ? pictures.map((picture, index) => ({ picture, index }))
    : pictures[currentImageIndex]
    ? [{ index: currentImageIndex, picture: pictures[currentImageIndex] }]
    : [];

  return (
    <CoverLayout cover={cover} width={width} userName={userName} {...props}>
      {displayedPictures.map(({ picture, index }) => {
        const isDisplayed = !playTransition || index === currentImageIndex;

        const mediaProps = {
          ref: (isDisplayed ? mediaRef : null) as any,
          aspectRatio: picture.ratio,
          source: picture.source,
          uri: width === COVER_BASE_WIDTH ? picture.smallURI : picture.largeURI,
          width,
          onReadyForDisplay: isDisplayed ? onReadyForDisplay : undefined,
          style: styles.coverContent,
        };
        return (
          <ViewTransition
            key={picture.source}
            style={[styles.coverContent, { opacity: isDisplayed ? 1 : 0 }]}
            transitionDuration={300}
            transitions={['opacity']}
            easing="ease-in-out"
            testID={`cover-media-container-${picture.source}`}
          >
            {picture.__typename === 'MediaVideo' && (
              <MediaVideoRenderer
                {...mediaProps}
                // TODO alt generation by cloudinary AI ? include text in small format ?
                alt={`This is a video posted by ${userName}`}
                thumbnailURI={
                  width === COVER_BASE_WIDTH
                    ? picture.smallThumbnail
                    : picture.largeThumbnail
                }
                muted
                currentTime={initialVideosTimes?.[index]}
                paused={videoPaused || !isDisplayed}
                onEnd={onVideoEnd}
                testID={`cover-video-${picture.source}`}
              />
            )}
            {picture.__typename === 'MediaImage' && (
              <MediaImageRenderer
                {...mediaProps}
                // TODO alt generation by cloudinary AI ? include text in small format ?
                alt={`This is an image posted by ${userName}`}
                testID={`cover-image-${picture.source}`}
              />
            )}
          </ViewTransition>
        );
      })}
    </CoverLayout>
  );
};

export default forwardRef(CoverRenderer);

export const QR_CODE_POSITION_CHANGE_EVENT = 'QR_CODE_POSITION_CHANGE_EVENT';

const styles = StyleSheet.create({
  coverContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
