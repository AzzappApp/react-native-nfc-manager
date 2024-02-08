import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_ANIMATION_DURATION,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import CoverStaticMediaLayer from '#components/CoverRenderer/CoverStaticMediaLayer';
import CoverTextRenderer from '#components/CoverRenderer/CoverTextRenderer';
import MediaAnimator from '#components/CoverRenderer/MediaAnimator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import CoverMediaPreview from './CoverMediaPreview';
import type { CoverTextRendererProps } from '#components/CoverRenderer/CoverTextRenderer';
import type { CoverMediaPreviewProps } from './CoverMediaPreview';

type CoverPreviewRendererProps = Omit<
  CoverMediaPreviewProps,
  'onLoadingEnd' | 'onLoadingError' | 'onLoadingStart' | 'uri'
> &
  Omit<CoverTextRendererProps, 'height'> & {
    /**
     * the source media uri
     */
    uri?: string | null;
    /**
     * the animation to apply on the  media
     */
    mediaAnimation?: string | null;
    /**
     * The background image uri
     */
    backgroundId?: string | null;
    /**
     * The foreground image id
     */
    foregroundId?: string | null;
    /**
     * The foreground image id
     */
    foregroundKind?: string | null;
    /**
     * the foreground image uri
     */
    foregroundImageUri?: string | null;
    /**
     * The tint color of the foreground image
     */
    foregroundImageTintColor?: string | null;
    /**
     * the Color palette of the cover
     */
    colorPalette?: {
      primary: string;
      light: string;
      dark: string;
    };
    /**
     * Callback called when the cover starts loading
     */
    onStartLoading?: () => void;
    /**
     * Callback called when the cover preview has loaded all its medias
     */
    onLoad?: () => void;
    /**
     * Callback called when the cover preview failed to load a media
     */
    onError?: () => void;
    /**
     * the width of the cover
     */
    width: number;
  };

/**
 * Render a cover in preview mode, which means that the cover will be rendered from the sourceMedia
 * and the different text styles that will be applied on it instead of the generated cover media
 * used in CoverEditionScreen and in CoverTemplateRenderer
 */
const CoverPreviewRenderer = ({
  // media props
  uri,
  kind,
  time,
  startTime,
  duration,
  mediaAnimation,
  backgroundColor,
  maskUri,
  backgroundId,
  backgroundImageUri,
  backgroundImageTintColor,
  foregroundId,
  foregroundKind,
  foregroundImageUri,
  foregroundImageTintColor,
  backgroundMultiply,
  editionParameters,
  filter,
  // text props
  title,
  titleStyle,
  subTitle,
  subTitleStyle,
  textOrientation,
  textPosition,
  textAnimation,
  videoDisabled,
  videoPreview,
  paused,
  // other props
  colorPalette,
  width,
  style,
  onStartLoading,
  onLoad,
  onError,
  ...props
}: CoverPreviewRendererProps) => {
  const height = width / COVER_RATIO;
  const borderRadius = width * COVER_CARD_RADIUS;

  const loadingStatus = useRef({
    mediaLoading: !!uri || (Platform.OS === 'android' && !!backgroundImageUri),
    foregroundLoading: !!foregroundImageUri,
    backgroundLoading: !!backgroundImageUri && Platform.OS !== 'android',
  });

  const prevProps = useRef({
    uri,
    foregroundImageUri,
    backgroundImageUri,
  });

  const [allMediaLoaded, setAllMediaLoaded] = useState(
    !loadingStatus.current.mediaLoading &&
      !loadingStatus.current.foregroundLoading &&
      !loadingStatus.current.backgroundLoading,
  );

  useEffect(() => {
    if (prevProps.current.uri !== uri) {
      const mediaLoading = !!uri;
      loadingStatus.current.mediaLoading = mediaLoading;
      prevProps.current.uri = uri;
      if (mediaLoading) {
        setAllMediaLoaded(false);
      }
    }
    if (prevProps.current.foregroundImageUri !== foregroundImageUri) {
      prevProps.current.foregroundImageUri = foregroundImageUri;
      const foregroundLoading = !!foregroundImageUri;
      loadingStatus.current.foregroundLoading = foregroundLoading;
      if (foregroundLoading) {
        setAllMediaLoaded(false);
      }
    }
    if (prevProps.current.backgroundImageUri !== backgroundImageUri) {
      prevProps.current.backgroundImageUri = backgroundImageUri;
      const mediaLoading =
        loadingStatus.current.mediaLoading ||
        (Platform.OS === 'android' && !!backgroundImageUri);
      const backgroundLoading =
        !!backgroundImageUri && Platform.OS !== 'android';

      loadingStatus.current.mediaLoading = mediaLoading;
      loadingStatus.current.backgroundLoading = backgroundLoading;
      if (backgroundLoading || mediaLoading) {
        setAllMediaLoaded(false);
      }
    }
  }, [backgroundImageUri, foregroundImageUri, uri]);

  const [videoReady, setVideoReady] = useState(kind !== 'video');
  useEffect(() => {
    setVideoReady(kind !== 'video');
  }, [kind]);

  const mediasReadyHandler = useCallback(() => {
    const { mediaLoading, foregroundLoading, backgroundLoading } =
      loadingStatus.current;
    if (!mediaLoading && !foregroundLoading && !backgroundLoading) {
      onLoad?.();
      setAllMediaLoaded(true);
    }
  }, [onLoad]);

  useEffect(() => {
    if (!allMediaLoaded) {
      onStartLoading?.();
    }
  }, [allMediaLoaded, onStartLoading]);

  const onMediaLoad = useCallback(() => {
    loadingStatus.current.mediaLoading = false;
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onForegroundLoad = useCallback(() => {
    loadingStatus.current.foregroundLoading = false;
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onBackgroundLoad = useCallback(() => {
    loadingStatus.current.backgroundLoading = false;
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onVideoLoaded = useCallback(() => {
    setVideoReady(true);
  }, []);

  const styles = useStyleSheet(styleSheet);

  const { width: windowWidth } = useWindowDimensions();
  const layerStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      height,
      width,
    }),
    [height, width],
  );

  const animationSharedValue = useSharedValue(0);

  const onProgress = useCallback(
    (event: { currentTime: number; duration: number }) => {
      const { currentTime, duration } = event;
      if (!paused) {
        if (currentTime / duration <= 0.1 / duration) {
          animationSharedValue.value = 0;
        } else {
          animationSharedValue.value = withTiming(
            currentTime / duration + 0.1 / duration,
            { duration: 100, easing: Easing.linear },
          );
        }
      }
    },
    [animationSharedValue, paused],
  );

  useEffect(() => {
    animationSharedValue.value = 0;
    if (!paused && allMediaLoaded && videoReady) {
      // we setup the animations even for the video cover
      // to avoid flickering of the animation due to the delay
      // of inProgress event on the first frames
      animationSharedValue.value = withRepeat(
        withTiming(1, {
          duration: COVER_ANIMATION_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
  }, [
    animationSharedValue,
    paused,
    videoReady,
    allMediaLoaded,
    // we want to restart the animation when the text animation or the media animation change
    textAnimation,
    mediaAnimation,
  ]);

  return (
    <View
      style={[styles.root, { borderRadius, height }, styles.coverShadow, style]}
      {...props}
    >
      <View style={[styles.topPanelContent, { borderRadius }]}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height,
            width,
            backgroundColor: swapColor(backgroundColor, colorPalette) as any,
          }}
        />
        {Platform.OS !== 'android' && backgroundId && backgroundImageUri && (
          <CoverStaticMediaLayer
            testID="cover-foreground-preview"
            mediaId={backgroundId}
            uri={backgroundImageUri}
            requestedSize={windowWidth}
            tintColor={swapColor(backgroundImageTintColor, colorPalette)}
            kind="png"
            animationSharedValue={paused ? null : animationSharedValue}
            onReady={onBackgroundLoad}
            onError={onError}
            style={layerStyle}
          />
        )}
        {uri && (
          <MediaAnimator
            animation={mediaAnimation}
            animationSharedValue={paused ? null : animationSharedValue}
            width={width}
            height={height}
            style={styles.cover}
          >
            <CoverMediaPreview
              key={uri}
              uri={uri}
              kind={kind}
              time={time}
              startTime={startTime}
              duration={duration}
              maskUri={maskUri}
              backgroundColor={
                Platform.OS === 'android'
                  ? swapColor(backgroundColor, colorPalette)
                  : 'transparent'
              }
              backgroundMultiply={backgroundMultiply}
              backgroundImageUri={
                Platform.OS === 'android' ? backgroundImageUri : null
              }
              backgroundImageTintColor={swapColor(
                backgroundImageTintColor,
                colorPalette,
              )}
              filter={filter}
              editionParameters={editionParameters}
              videoDisabled={videoDisabled}
              paused={paused || !allMediaLoaded}
              videoPreview={videoPreview}
              onLoadingEnd={onMediaLoad}
              onLoadingError={onError}
              onVideoLoaded={onVideoLoaded}
              style={styles.cover}
              testID="cover-edition-screen-cover-preview"
              onProgress={onProgress}
            />
          </MediaAnimator>
        )}
        {foregroundId && foregroundImageUri && (
          <CoverStaticMediaLayer
            testID="cover-foreground-preview"
            mediaId={foregroundId}
            uri={foregroundImageUri}
            requestedSize={windowWidth}
            tintColor={swapColor(foregroundImageTintColor, colorPalette)}
            kind={foregroundKind ?? 'png'}
            animationSharedValue={paused ? null : animationSharedValue}
            onReady={onForegroundLoad}
            onError={onError}
            style={layerStyle}
          />
        )}
        <CoverTextRenderer
          key={`${title}-${subTitle}-${textAnimation}`}
          title={title}
          subTitle={subTitle}
          titleStyle={titleStyle}
          subTitleStyle={subTitleStyle}
          textOrientation={textOrientation}
          textPosition={textPosition}
          textAnimation={textAnimation}
          pointerEvents="none"
          style={styles.titleOverlayContainer}
          colorPalette={colorPalette}
          height={height}
          animationSharedValue={paused ? null : animationSharedValue}
        />
      </View>
    </View>
  );
};

export default CoverPreviewRenderer;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    aspectRatio: COVER_RATIO,
  },
  coverShadow: shadow(appearance, 'center'),
  topPanelContent: {
    flex: 1,
    overflow: 'hidden',
  },
  cover: {
    flex: 1,
    aspectRatio: COVER_RATIO,
  },
  maskComputingOverlay: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: COVER_RATIO,
  },
  titleOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 10,
  },
  qrCode: {
    position: 'absolute',
    top: '10%',
    height: '6.5%',
    left: '45%',
    width: '10%',
  },
}));
