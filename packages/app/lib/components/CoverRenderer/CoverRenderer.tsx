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
import MediaRenderer from '../MediaRenderer';
import CoverLayout from './CoverLayout';
import type { CoverLayoutProps } from './CoverLayout';
import type { CoverRenderer_cover$key } from '@azzapp/relay/artifacts/CoverRenderer_cover.graphql';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';
import type { OnProgressData } from 'react-native-video';

export type CoverRendererProps = Omit<
  CoverLayoutProps,
  'children' | 'cover'
> & {
  cover: CoverRenderer_cover$key | null | undefined;
  playTransition?: boolean;
  videoPaused?: boolean;
  imageIndex?: number;
  forceImageIndex?: boolean;
  currentTime?: number;
  onReadyForDisplay?: () => void;
};

export type CoverHandle = {
  getCurrentMediaRenderer(): HostComponent<any> | null;
  getCurrentImageIndex(): number;
  getCurrentVideoTime(): number;
};

const CoverRenderer = (
  {
    cover: coverKey,
    userName,
    width = 125,
    playTransition = false,
    videoPaused = false,
    imageIndex = 0,
    forceImageIndex,
    currentTime = 0,
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
          source
          kind
          ratio
          # since cover are mainly used with 2 size full screen and cover size
          # we preload those url to avoid unecessary round trip
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            @include(if: $isNative)
          smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            @include(if: $isNative)
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
  const videoTimeRef = useRef(0);

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
      videoTimeRef.current = 0;
    }
  };

  const playInterval = (cover?.pictureTransitionTimer ?? 0) * 1000;
  useInterval(
    () => {
      if (cover?.pictures.length) {
        const currentPicture = cover.pictures[currentImageIndex];
        if (currentPicture.kind === 'picture') {
          nextIndex();
        }
      }
    },
    playTransition ? playInterval : 0,
  );

  const onVideoEnd = () => {
    nextIndex();
  };

  const onVideoProgress = (data: OnProgressData) => {
    videoTimeRef.current = data.currentTime;
  };

  /**
   * Imperative Handle
   */
  const mediaRef = useRef<HostComponent<any>>(null);

  useImperativeHandle(
    forwardRef,
    () => ({
      getCurrentMediaRenderer() {
        return mediaRef.current;
      },
      getCurrentImageIndex() {
        return currentImageIndex;
      },
      getCurrentVideoTime() {
        return videoTimeRef.current;
      },
    }),
    [currentImageIndex],
  );

  /**
   * Rendering
   */
  const { pictures = [] } = cover ?? {};

  const displayedPictures = (
    playTransition ? pictures : [pictures[currentImageIndex]]
  )
    // picture could be null in case of invalid image Index
    .filter(picture => !!picture);

  return (
    <CoverLayout cover={cover} width={width} userName={userName} {...props}>
      {displayedPictures.map((picture, index) => {
        const isDisplayed = !playTransition || index === currentImageIndex;
        return (
          <ViewTransition
            key={picture.source}
            style={[styles.coverContent, { opacity: isDisplayed ? 1 : 0 }]}
            transitionDuration={300}
            transitions={['opacity']}
            easing="ease-in-out"
          >
            <MediaRenderer
              ref={isDisplayed ? mediaRef : null}
              kind={picture.kind}
              aspectRatio={picture.ratio}
              source={picture.source}
              uri={
                width === COVER_BASE_WIDTH ? picture.smallURI : picture.largeURI
              }
              width={width}
              muted
              repeat
              // TODO
              // react native video crash if we use a currentTime that is the same
              // that the currently used time
              currentTime={currentTime ? currentTime : undefined}
              paused={videoPaused || !isDisplayed}
              onReadyForDisplay={isDisplayed ? onReadyForDisplay : undefined}
              onEnd={onVideoEnd}
              onProgress={onVideoProgress}
              style={styles.coverContent}
            />
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
