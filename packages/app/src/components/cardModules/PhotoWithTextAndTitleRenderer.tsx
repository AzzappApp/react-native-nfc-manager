import { Image } from 'expo-image';
import { useState, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import Text from '#ui/Text';
import CardModuleBackground from './CardModuleBackground';
import type {
  PhotoWithTextAndTitleRenderer_module$data,
  PhotoWithTextAndTitleRenderer_module$key,
} from '#relayArtifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
  ColorValue,
  TextStyle,
  ViewStyle,
} from 'react-native';

const PhotoWithTextAndTitleRendererFragment = graphql`
  fragment PhotoWithTextAndTitleRenderer_module on CardModulePhotoWithTextAndTitle
  @inline
  @argumentDefinitions(
    screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
    pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
  ) {
    image {
      uri(width: $screenWidth, pixelRatio: $pixelRatio)
    }
    contentFontFamily
    contentFontColor
    contentTextAlign
    contentFontSize
    contentVerticalSpacing
    content
    titleFontFamily
    titleFontColor
    titleTextAlign
    titleFontSize
    titleVerticalSpacing
    title
    aspectRatio
    imageMargin
    verticalArrangement
    horizontalArrangement
    gap
    title
    borderRadius
    marginHorizontal
    marginVertical
    background {
      uri
      resizeMode
    }
    backgroundStyle {
      backgroundColor
      patternColor
    }
  }
`;

export const readPhotoWithTextAndTitleData = (
  module: PhotoWithTextAndTitleRenderer_module$key,
) => readInlineData(PhotoWithTextAndTitleRendererFragment, module);

export type PhotoWithTextAndTitleRendererData = NullableFields<
  Omit<PhotoWithTextAndTitleRenderer_module$data, ' $fragmentType'>
>;

export type PhotoWithTextAndTitleRendererProps = ViewProps & {
  /**
   * The view mode for the module
   */
  displayMode?: 'desktop' | 'edit' | 'mobile';
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
  /**
   * The data for the PhotoWithTextAndTitle module
   */
  data: PhotoWithTextAndTitleRendererData;
};

/**
 * Render a PhotoWithTextAndTitle module
 */
const PhotoWithTextAndTitleRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  displayMode,
  coverBackgroundColor,
  ...props
}: PhotoWithTextAndTitleRendererProps) => {
  const {
    image,
    contentFontFamily,
    contentFontColor,
    contentTextAlign,
    content,
    titleFontFamily,
    titleFontColor,
    titleTextAlign,
    title,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    background,
    backgroundStyle,
    aspectRatio,
    borderRadius,
    contentFontSize,
    contentVerticalSpacing,
    gap,
    marginHorizontal,
    marginVertical,
    titleFontSize,
    titleVerticalSpacing,
  } = getModuleDataValues({
    data,
    cardStyle,
    styleValuesMap: PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
    defaultValues: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  });

  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      props.onLayout?.(e);
      setLayout(e.nativeEvent.layout);
    },
    [props],
  );

  const widthMargin = (layout?.width ?? 0) - 2 * marginHorizontal;

  const imageWidth =
    displayMode === 'desktop'
      ? widthMargin / 2
      : imageMargin === 'width_full'
        ? (layout?.width ?? 0)
        : widthMargin;

  const flexDirection: ViewStyle['flexDirection'] =
    displayMode === 'desktop'
      ? horizontalArrangement === 'left'
        ? 'row'
        : 'row-reverse'
      : verticalArrangement === 'top'
        ? 'column'
        : 'column-reverse';

  const containerStyle = useMemo(
    () => ({
      marginVertical,
      flexDirection,
      rowGap: gap ?? 0,
      columnGap: gap ?? 0,
      width: displayMode === 'desktop' ? widthMargin : (layout?.width ?? 0),
      marginHorizontal: displayMode === 'desktop' ? (marginHorizontal ?? 0) : 0,
    }),
    [
      marginVertical,
      flexDirection,
      gap,
      displayMode,
      widthMargin,
      layout?.width,
      marginHorizontal,
    ],
  );

  const imageContainerStyle = useMemo(
    () => ({
      marginHorizontal: imageMargin !== 'width_full' ? marginHorizontal : 0,
      borderRadius,
    }),
    [imageMargin, marginHorizontal, borderRadius],
  );

  const imageStyle = useMemo(
    () => ({
      aspectRatio: aspectRatio ?? 1,
      width: imageWidth,
    }),
    [aspectRatio, imageWidth],
  );

  const textContainerStyle = useMemo(
    () =>
      ({
        width:
          displayMode === 'desktop' ? widthMargin / 2 - (gap ?? 0) : undefined,
        marginHorizontal:
          displayMode === 'desktop' ? 0 : (marginHorizontal ?? 0),
        justifyContent: displayMode === 'desktop' ? 'center' : undefined,
      }) as const,
    [displayMode, widthMargin, gap, marginHorizontal],
  );

  const titleStyle = useMemo(() => {
    return {
      lineHeight:
        titleFontSize && titleVerticalSpacing
          ? titleFontSize * 1.2 + titleVerticalSpacing
          : undefined,
      fontSize: titleFontSize,
    };
  }, [titleFontSize, titleVerticalSpacing]);

  const contentStyle = useMemo(() => {
    return {
      lineHeight:
        contentFontSize && contentVerticalSpacing
          ? contentFontSize * 1.2 + contentVerticalSpacing
          : undefined,
      fontSize: contentFontSize,
    };
  }, [contentFontSize, contentVerticalSpacing]);

  const intl = useIntl();

  const contentColor = swapColor(contentFontColor, colorPalette);

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundColor={swapColor(
        backgroundStyle?.backgroundColor,
        colorPalette,
      )}
      patternColor={swapColor(backgroundStyle?.patternColor, colorPalette)}
      resizeMode={background?.resizeMode}
      style={style}
      onLayout={onLayout}
    >
      <View style={containerStyle}>
        <View style={[imageContainerStyle, { overflow: 'hidden' }]}>
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={imageStyle}
              contentFit="cover"
            />
          )}
        </View>

        <View style={textContainerStyle}>
          {title !== '' && (
            <Text
              style={[
                titleStyle,
                {
                  textAlign: titleTextAlign as TextStyle['textAlign'],
                  fontFamily: titleFontFamily,
                  color: swapColor(titleFontColor, colorPalette) as ColorValue,
                },
              ]}
            >
              {title ??
                intl.formatMessage({
                  defaultMessage: 'Add section Title here',
                  description: 'PhotoWithTextAndTitle default module title',
                })}
            </Text>
          )}

          {content !== '' && (
            <Text
              style={[
                contentStyle,
                {
                  textAlign: contentTextAlign as TextStyle['textAlign'],
                  fontFamily: contentFontFamily,
                  marginTop: 7,
                  color: contentColor,
                },
              ]}
            >
              {content ??
                intl.formatMessage(
                  {
                    defaultMessage:
                      'Add section contents here. To edit the text, simply open the editor and start typing. You can also change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match the design and branding of your WebCard{azzappA}.',
                    description: 'PhotoWithTextAndTitle default module text',
                  },
                  {
                    azzappA: (
                      <Text variant="azzapp" style={{ color: contentColor }}>
                        a
                      </Text>
                    ),
                  },
                )}
            </Text>
          )}
        </View>
      </View>
    </CardModuleBackground>
  );
};

export default PhotoWithTextAndTitleRenderer;
