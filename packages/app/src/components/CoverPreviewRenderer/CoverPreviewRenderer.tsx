import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
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
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Delay from '#ui/Delay';
import Text from '#ui/Text';
import CoverMediaPreview from './CoverMediaPreview';
import type { CoverTextRendererProps } from '#components/CoverRenderer/CoverTextRenderer';
import type { CoverMediaPreviewProps } from './CoverMediaPreview';

type CoverPreviewRendererProps = CoverTextRendererProps &
  Omit<
    CoverMediaPreviewProps,
    'onLoadingEnd' | 'onLoadingError' | 'onLoadingStart' | 'uri'
  > & {
    /**
     * the source media uri
     */
    uri?: string | null;
    /**
     * the animation to apply on the  media
     */
    mediaAnimation?: string | null;
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
     * if true, a loading indicator will be displayed after a delay
     */
    computing?: boolean | null;
    /**
     * Callback called when the cover preview is ready
     */
    onReady?: () => void;
    /**
     * Callback called when the cover preview failed to load
     */
    onError?: () => void;
    /**
     * the height of the cover
     */
    height: number;
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
  // other props
  colorPalette,
  computing,
  height,
  onReady,
  onError,
  style,
  paused,
  ...props
}: CoverPreviewRendererProps) => {
  const borderRadius = height * COVER_RATIO * COVER_CARD_RADIUS;

  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(!!uri || !!backgroundImageUri);
  useEffect(() => {
    setForegroundLoading(!!foregroundId);
  }, [foregroundId]);

  const [foregroundLoading, setForegroundLoading] = useState(!!foregroundId);
  useEffect(() => {
    setIsLoading(!!uri || !!backgroundImageUri);
  }, [uri, backgroundImageUri]);

  const [videoReady, setVideoReady] = useState(kind !== 'video');
  useEffect(() => {
    setVideoReady(kind !== 'video');
  }, [kind]);

  const mediasReadyHandler = useCallback(() => {
    if ((!foregroundId || !foregroundLoading) && !isLoading) {
      onReady?.();
    }
  }, [foregroundId, foregroundLoading, isLoading, onReady]);

  const onMediaLoad = useCallback(() => {
    setIsLoading(false);
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onMediaLoadingError = useCallback(() => {
    setLoadingFailed(true);
    onError?.();
  }, [onError]);

  const onForegroundLoad = useCallback(() => {
    setForegroundLoading(false);
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onForegroundLoadingError = useCallback(() => {
    setForegroundLoading(false);
  }, []);

  const onVideoLoaded = useCallback(() => {
    setVideoReady(true);
  }, []);

  const onRetry = useCallback(() => {
    setLoadingFailed(false);
  }, []);

  const styles = useStyleSheet(styleSheet);

  const { width: windowWidth } = useWindowDimensions();
  const foregroundStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      height,
      width: height * COVER_RATIO,
      aspectRatio: COVER_RATIO,
    }),
    [height],
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
            { duration: 100 },
          );
        }
      }
    },
    [animationSharedValue, paused],
  );

  useEffect(() => {
    animationSharedValue.value = 0;
    if (
      !paused &&
      !loadingFailed &&
      !computing &&
      !isLoading &&
      !foregroundLoading &&
      videoReady
    ) {
      // we setup the animations even for the video cover
      // to avoid flickering of the animation due to the delay
      // of inProgress event on the first frames
      animationSharedValue.value = withRepeat(
        withTiming(1, { duration: COVER_ANIMATION_DURATION }),
        -1,
        false,
      );
    }
    // we want to restart the animation when the text animation or the media animation change
  }, [
    animationSharedValue,
    paused,
    textAnimation,
    mediaAnimation,
    loadingFailed,
    computing,
    isLoading,
    foregroundLoading,
    videoReady,
  ]);

  const intl = useIntl();

  let content: React.ReactNode = null;
  if (loadingFailed) {
    content = (
      <View style={styles.errorContainer}>
        <Text variant="error" style={styles.errorMessage}>
          <FormattedMessage
            defaultMessage="Failed to load the informations of your cover"
            description="Error message displayed when cover image failed to load"
          />
        </Text>
        <Button
          onPress={onRetry}
          label={intl.formatMessage({
            defaultMessage: 'Retry',
            description:
              'label of the button allowing  to retry loading cover image',
          })}
        />
      </View>
    );
  } else {
    content = (
      <>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height,
            width: height * COVER_RATIO,
            backgroundColor: swapColor(backgroundColor, colorPalette) as any,
          }}
        />
        {uri && (
          <MediaAnimator
            animation={mediaAnimation}
            animationSharedValue={paused ? null : animationSharedValue}
            width={height * COVER_RATIO}
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
              backgroundColor={swapColor(backgroundColor, colorPalette)}
              backgroundMultiply={backgroundMultiply}
              backgroundImageUri={backgroundImageUri}
              backgroundImageTintColor={swapColor(
                backgroundImageTintColor,
                colorPalette,
              )}
              filter={filter}
              editionParameters={editionParameters}
              paused={paused || foregroundLoading}
              onLoadingEnd={onMediaLoad}
              onLoadingError={onMediaLoadingError}
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
            onError={onForegroundLoadingError}
            style={foregroundStyle}
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

        {(computing || isLoading) && (
          <Delay delay={computing ? 0 : 100}>
            <View style={styles.maskComputingOverlay}>
              <ActivityIndicator color="white" />
            </View>
          </Delay>
        )}
      </>
    );
  }

  return (
    <View
      style={[styles.root, { borderRadius, height }, styles.coverShadow, style]}
      {...props}
    >
      <View style={[styles.topPanelContent, { borderRadius }]}>{content}</View>
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
