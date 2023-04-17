import { useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_PLACEMENT,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/cardHelpers';
import { EditableImageWithCropMode } from '#components/medias';
import Button from '#ui/Button';
import Delay from '#ui/Delay';
import Text from '#ui/Text';
import type { EditableImageSource } from '#components/medias';
import type { CropData, ImageEditionParameters } from '#helpers/mediaHelpers';
import type {
  CardCoverContentStyleInput,
  CardCoverTextStyleInput,
} from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { ForwardedRef } from 'react';
import type {
  LayoutChangeEvent,
  ViewStyle,
  LayoutRectangle,
  ViewProps,
} from 'react-native';

type CoverPreviewRendererProps = ViewProps & {
  /**
   * The source media of the cover
   */
  source?: EditableImageSource | null;
  /**
   * The size of the source media
   */
  mediaSize?: { width: number; height: number } | null;
  /**
   * The background color of the cover
   */
  backgroundImageColor?: string | null;
  /**
   * The tint color of the background image
   */
  backgroundImageTintColor?: string | null;
  /**
   * The tint color of the foreground image
   */
  foregroundImageTintColor?: string | null;
  /**
   * Should the main image be multiplied by the background image
   */
  backgroundMultiply?: boolean | null;
  /**
   * The title of the cover
   */
  title: string | null | undefined;
  /**
   * The style of the title
   */
  titleStyle: CardCoverTextStyleInput | null | undefined;
  /**
   * The sub title of the cover
   */
  subTitle: string | null | undefined;
  /**
   * The style of the sub title
   */
  subTitleStyle: CardCoverTextStyleInput | null | undefined;
  /**
   * The style of the content
   */
  contentStyle: CardCoverContentStyleInput | null | undefined;
  /**
   * Edition parameters to apply on the sourceMedia image
   */
  editionParameters?: ImageEditionParameters | null;
  /**
   * Image filter to apply on the sourceMedia image
   * @type {(string | null)}
   */
  filter?: string | null;
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
  /**
   * use the default shadow effect arond the card
   *
   * @type {(boolean | null)}
   */
  withShadow?: boolean | null;
};

export type CoverPreviewHandler = {
  capture: () => Promise<string | null>;
};

/**
 * Render a cover in preview mode, which means that the cover will be rendered from the sourceMedia
 * and the different text styles that will be applied on it instead of the generated cover media
 * used in CoverEditionScreen and in CoverTemplateRenderer
 */
const CoverPreviewRenderer = (
  {
    source,
    mediaSize,
    backgroundImageColor,
    backgroundImageTintColor,
    foregroundImageTintColor,
    backgroundMultiply,
    editionParameters,
    filter,
    title,
    titleStyle,
    subTitle,
    subTitleStyle,
    contentStyle,
    computing,
    cropEditionMode,
    onCropDataChange,
    onLayout,
    style,
    ...props
  }: CoverPreviewRendererProps,
  forwardedRef: ForwardedRef<CoverPreviewHandler>,
) => {
  const [containerLayout, setContainerLayout] =
    useState<LayoutRectangle | null>(null);
  const onLayoutInner = (event: LayoutChangeEvent) => {
    setContainerLayout(event.nativeEvent.layout);
    if (onLayout) {
      onLayout(event);
    }
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
  const textOverlayRef = useRef<View | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => ({
      async capture() {
        if (textOverlayRef.current == null) {
          return null;
        }
        return captureRef(textOverlayRef.current, {
          format: 'png',
          quality: 1,
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
    setIsLoading(false);
  };

  const onError = () => {
    setLoadingFailed(true);
  };

  const onRetry = () => {
    setLoadingFailed(false);
  };

  const scale = containerLayout ? containerLayout.width / COVER_BASE_WIDTH : 1;

  const orientation =
    contentStyle?.orientation ?? DEFAULT_COVER_CONTENT_ORTIENTATION;
  const placement = contentStyle?.placement ?? DEFAULT_COVER_CONTENT_PLACEMENT;

  const verticalPosition: 'bottom' | 'middle' | 'top' =
    // prettier-ignore
    placement.startsWith( 'top', )
    ? 'top'
    : placement.startsWith('bottom')
    ? 'bottom'
    : 'middle';

  const horizontalPosition: 'center' | 'left' | 'right' =
    // prettier-ignore
    placement.endsWith( 'Left', )
    ? 'left'
    : placement.endsWith('Right')
    ? 'right'
    : 'center';

  let overlayJustifyContent: ViewStyle['justifyContent'];
  if (orientation === 'horizontal') {
    overlayJustifyContent =
      verticalPosition === 'top'
        ? 'flex-start'
        : verticalPosition === 'middle'
        ? 'center'
        : 'flex-end';
  } else if (orientation === 'topToBottom') {
    overlayJustifyContent =
      horizontalPosition === 'left'
        ? 'flex-end'
        : horizontalPosition === 'center'
        ? 'center'
        : 'flex-start';
  } else {
    overlayJustifyContent =
      horizontalPosition === 'left'
        ? 'flex-start'
        : horizontalPosition === 'center'
        ? 'center'
        : 'flex-end';
  }

  let textAlign: 'center' | 'left' | 'right';
  if (orientation === 'horizontal') {
    textAlign =
      horizontalPosition === 'left'
        ? 'left'
        : horizontalPosition === 'center'
        ? 'center'
        : 'right';
  } else if (orientation === 'topToBottom') {
    textAlign =
      verticalPosition === 'top'
        ? 'left'
        : verticalPosition === 'middle'
        ? 'center'
        : 'right';
  } else {
    textAlign =
      verticalPosition === 'bottom'
        ? 'left'
        : verticalPosition === 'middle'
        ? 'center'
        : 'right';
  }

  const titleOverlayStyles: ViewStyle | null = containerLayout && {
    position: 'absolute',
    width:
      orientation === 'horizontal'
        ? containerLayout.width
        : containerLayout.height,
    height:
      orientation === 'horizontal'
        ? containerLayout.height
        : containerLayout.width,
    transform:
      orientation !== 'horizontal'
        ? [
            { rotate: orientation === 'bottomToTop' ? '-90deg' : '90deg' },
            {
              translateX:
                // prettier-ignore
                (orientation === 'bottomToTop' ? -1 : 1) * 
                (containerLayout.height - containerLayout.width) / 2,
            },
            {
              translateY:
                // prettier-ignore
                (orientation === 'bottomToTop' ? 1 : -1) * 
                (containerLayout.width - containerLayout.height) / 2,
            },
          ]
        : [],
    padding: '5%',
    paddingTop: orientation === 'horizontal' ? '30%' : '5%',
    paddingLeft: orientation === 'topToBottom' ? '30%' : '5%',
    paddingRight: orientation === 'bottomToTop' ? '30%' : '5%',
    justifyContent: overlayJustifyContent,
  };

  const titleTextStyle = {
    fontFamily: titleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
    color: titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
    fontSize: (titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale,
    textAlign,
  } as const;

  const subTitleTextStyle = {
    fontFamily: subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
    color: subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
    fontSize: (subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale,
    textAlign,
  } as const;

  return (
    <View
      style={[styles.root, { borderRadius }, style]}
      {...props}
      onLayout={onLayoutInner}
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
            {source && mediaSize && (
              <EditableImageWithCropMode
                source={source}
                mediaSize={mediaSize}
                aspectRatio={COVER_RATIO}
                editionParameters={editionParameters ?? {}}
                backgroundImageColor={backgroundImageColor}
                backgroundImageTintColor={backgroundImageTintColor}
                backgroundMultiply={backgroundMultiply}
                foregroundImageTintColor={foregroundImageTintColor}
                filters={filter ? [filter] : []}
                cropEditionMode={cropEditionMode}
                style={styles.cover}
                onLoadStart={onLoadStart}
                onLoad={onLoad}
                onError={onError}
                onCropDataChange={onCropDataChange}
              />
            )}

            <View
              style={styles.titleOverlayContainer}
              ref={textOverlayRef}
              pointerEvents="none"
            >
              <View style={titleOverlayStyles}>
                <Text allowFontScaling={false} style={titleTextStyle}>
                  {title ?? ''}
                </Text>
                {!!subTitle && (
                  <Text allowFontScaling={false} style={subTitleTextStyle}>
                    {subTitle}
                  </Text>
                )}
              </View>
            </View>
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
