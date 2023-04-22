import { useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import Cropper from '#components/Cropper';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button from '#ui/Button';
import Delay from '#ui/Delay';
import Text from '#ui/Text';
import CoverMediaPreview from './CoverMediaPreview';
import CoverTextPreview from './CoverTextPreview';
import type {
  CropData,
  GPUImageViewHandle,
  GPUVideoViewHandle,
} from '#components/gpu';
import type { CoverMediaPreviewProps } from './CoverMediaPreview';
import type {
  CoverTextPreviewProps,
  CoverTextPreviewHandle,
} from './CoverTextPreview';
import type { ForwardedRef } from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';

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
     * The size of the source media
     */
    mediaSize?: { width: number; height: number } | null;
    /**
     * if true, a loading indicator will be displayed after a delay
     */
    computing?: boolean | null;
    /**
     * Enable the crop edition mode on the sourceMedia image
     *
     * @type {(boolean | null)}
     */
    cropEditionMode?: boolean | null;
    /**
     * Callback called when the crop data of the sourceMedia image change
     */
    onCropDataChange?: (cropData: CropData) => void;
  };

export type CoverPreviewHandler = {
  exportTextMedia: () => Promise<string | null>;
  exporteMedia: (size: {
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
    contentStyle,
    // other props
    mediaSize,
    computing,
    cropEditionMode,
    onCropDataChange,
    style,
    ...props
  }: CoverPreviewRendererProps,
  forwardedRef: ForwardedRef<CoverPreviewHandler>,
) => {
  const [containerLayout, setContainerLayout] =
    useState<LayoutRectangle | null>(null);
  const onLayout = (event: LayoutChangeEvent) => {
    setContainerLayout(event.nativeEvent.layout);
    props.onLayout?.(event);
  };

  const borderRadius = Platform.select({
    web: COVER_CARD_RADIUS ? (`${COVER_CARD_RADIUS}%` as any) : null,
    default:
      containerLayout != null && COVER_CARD_RADIUS != null
        ? COVER_CARD_RADIUS * containerLayout.width
        : null,
  });

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
      async exporteMedia(size) {
        if (mediaRef.current == null) {
          return null;
        }
        if ('exportImage' in mediaRef.current) {
          return mediaRef.current.exportImage({ size });
        }
        return mediaRef.current.exportVideo({ size });
      },
    }),
    [],
  );

  const intl = useIntl();

  const onLoadStart = () => {
    setIsLoading(true);
  };

  const onLoad = () => {
    setIsLoading(false);
  };

  const onError = () => {
    setLoadingFailed(true);
  };

  const onRetry = () => {
    setLoadingFailed(false);
  };

  const appearanceStyle = useStyleSheet(computedStyle);

  return (
    <View
      style={[
        styles.root,
        { borderRadius },
        appearanceStyle.coverShadow,
        style,
      ]}
      {...props}
      onLayout={onLayout}
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
            {mediaSize && uri && (
              <Cropper
                mediaSize={mediaSize}
                aspectRatio={COVER_RATIO}
                cropData={editionParameters?.cropData}
                orientation={editionParameters?.orientation}
                pitch={editionParameters?.pitch}
                yaw={editionParameters?.yaw}
                roll={editionParameters?.roll}
                cropEditionMode={cropEditionMode}
                onCropDataChange={onCropDataChange}
                style={styles.cover}
              >
                {cropData => (
                  <CoverMediaPreview
                    ref={mediaRef}
                    uri={uri}
                    kind={kind}
                    time={time}
                    startTime={startTime}
                    duration={duration}
                    backgroundColor={backgroundColor}
                    maskUri={maskUri}
                    backgroundImageUri={backgroundImageUri}
                    backgroundImageTintColor={backgroundImageTintColor}
                    foregroundImageUri={foregroundImageUri}
                    foregroundImageTintColor={foregroundImageTintColor}
                    backgroundMultiply={backgroundMultiply}
                    filter={filter}
                    editionParameters={{
                      ...editionParameters,
                      cropData,
                    }}
                    onLoadingStart={onLoadStart}
                    onLoadingEnd={onLoad}
                    onLoadingError={onError}
                    style={styles.cover}
                    testID="cover-edition-screen-cover-preview"
                  />
                )}
              </Cropper>
            )}

            <CoverTextPreview
              title={title}
              subTitle={subTitle}
              titleStyle={titleStyle}
              subTitleStyle={subTitleStyle}
              contentStyle={contentStyle}
              ref={textOverlayRef}
              pointerEvents="none"
              style={styles.titleOverlayContainer}
            />
            {(computing || isLoading) && (
              <Delay delay={computing ? 0 : 500}>
                <View style={styles.maskComputingOverlay}>
                  <ActivityIndicator size="large" color="white" />
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

const computedStyle = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
}));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    aspectRatio: COVER_RATIO,
  },
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
    height: '100%',
    width: '100%',
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
});
