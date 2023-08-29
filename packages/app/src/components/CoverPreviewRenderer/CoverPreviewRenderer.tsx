import { useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_CARD_RADIUS,
  COVER_RATIO,
  COVER_VIDEO_BITRATE,
} from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Delay from '#ui/Delay';
import Text from '#ui/Text';
import CoverMediaPreview from './CoverMediaPreview';
import CoverTextPreview from './CoverTextPreview';
import type { GPUImageViewHandle, GPUVideoViewHandle } from '#components/gpu';
import type { CoverMediaPreviewProps } from './CoverMediaPreview';
import type {
  CoverTextPreviewProps,
  CoverTextPreviewHandle,
} from './CoverTextPreview';
import type { ForwardedRef } from 'react';

type CoverPreviewRendererProps = CoverTextPreviewProps &
  Omit<
    CoverMediaPreviewProps,
    'onLoadingEnd' | 'onLoadingError' | 'onLoadingStart' | 'uri'
  > & {
    /**
     * the source media uri
     */
    uri?: string | null;
    /**
     * The foreground image id
     */
    foregroundId?: string | null;
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

export type CoverPreviewHandler = {
  exportTextMedia: () => Promise<string | null>;
  exportMedia: (size: {
    width: number;
    height: number;
  }) => Promise<string | null>;
};

/**
 * Render a cover in preview mode, which means that the cover will be rendered from the sourceMedia
 * and the different text styles that will be applied on it instead of the generated cover media
 * used in CoverEditionScreen and in CoverTemplateRenderer
 */
const CoverPreviewRenderer = (
  {
    // media props
    uri,
    kind,
    time,
    startTime,
    duration,
    backgroundColor,
    maskUri,
    backgroundImageUri,
    backgroundImageTintColor,
    foregroundId,
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
    // other props
    colorPalette,
    computing,
    height,
    onReady,
    onError,
    style,
    paused,
    ...props
  }: CoverPreviewRendererProps,
  forwardedRef: ForwardedRef<CoverPreviewHandler>,
) => {
  const borderRadius = height * COVER_RATIO * COVER_CARD_RADIUS;

  const [isLoading, setIsLoading] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const mediaRef = useRef<GPUImageViewHandle | GPUVideoViewHandle | null>(null);
  const textOverlayRef = useRef<CoverTextPreviewHandle | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => ({
      async exportTextMedia() {
        if (textOverlayRef.current == null) {
          return null;
        }
        return textOverlayRef.current.capture();
      },
      async exportMedia(size) {
        if (mediaRef.current == null) {
          return null;
        }
        if ('exportImage' in mediaRef.current) {
          return mediaRef.current.exportImage({ size });
        }
        return mediaRef.current.exportVideo({
          size,
          removeSound: true,
          bitRate: COVER_VIDEO_BITRATE,
        });
      },
    }),
    [],
  );

  const intl = useIntl();

  const onLoadStart = () => {
    setIsLoading(true);
  };

  const onLoad = () => {
    // A delay to avoid flickering
    setTimeout(() => {
      setIsLoading(false);
      onReady?.();
    }, 50);
  };

  const onLoadingError = () => {
    setLoadingFailed(true);
    onError?.();
  };

  const onRetry = () => {
    setLoadingFailed(false);
  };

  const styles = useStyleSheet(styleSheet);

  const { width: windowWidth } = useWindowDimensions();

  return (
    <View
      style={[styles.root, { borderRadius, height }, styles.coverShadow, style]}
      {...props}
    >
      <View style={[styles.topPanelContent, { borderRadius }]}>
        {loadingFailed ? (
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
        ) : (
          <>
            {uri && (
              <CoverMediaPreview
                key={uri}
                ref={mediaRef}
                uri={uri}
                kind={kind}
                time={time}
                startTime={startTime}
                duration={duration}
                backgroundColor={swapColor(backgroundColor, colorPalette)}
                maskUri={maskUri}
                backgroundImageUri={backgroundImageUri}
                backgroundImageTintColor={swapColor(
                  backgroundImageTintColor,
                  colorPalette,
                )}
                backgroundMultiply={backgroundMultiply}
                filter={filter}
                editionParameters={editionParameters}
                paused={paused}
                onLoadingStart={onLoadStart}
                onLoadingEnd={onLoad}
                onLoadingError={onLoadingError}
                style={styles.cover}
                testID="cover-edition-screen-cover-preview"
              />
            )}
            {foregroundImageUri && foregroundId && (
              <MediaImageRenderer
                testID="cover-foreground-preview"
                pointerEvents="none"
                source={{
                  uri: foregroundImageUri,
                  mediaId: foregroundId,
                  requestedSize: windowWidth,
                }}
                tintColor={swapColor(foregroundImageTintColor, colorPalette)}
                aspectRatio={COVER_RATIO}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height,
                  width: height * COVER_RATIO,
                }}
                alt={'Cover edition foreground'}
              />
            )}
            <CoverTextPreview
              title={title}
              subTitle={subTitle}
              titleStyle={titleStyle}
              subTitleStyle={subTitleStyle}
              textOrientation={textOrientation}
              textPosition={textPosition}
              ref={textOverlayRef}
              pointerEvents="none"
              style={styles.titleOverlayContainer}
              colorPalette={colorPalette}
              height={height}
            />

            {(computing || isLoading) && (
              <Delay delay={computing ? 0 : 100}>
                <View style={styles.maskComputingOverlay}>
                  <ActivityIndicator color="white" />
                </View>
              </Delay>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default forwardRef(CoverPreviewRenderer);

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
