import { useState, useCallback } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import type {
  PhotoWithTextAndTitleRenderer_module$data,
  PhotoWithTextAndTitleRenderer_module$key,
} from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
  ColorValue,
  TextStyle,
} from 'react-native';

const PhotoWithTextAndTitleRendererFragment = graphql`
  fragment PhotoWithTextAndTitleRenderer_module on CardModulePhotoWithTextAndTitle
  @inline
  @argumentDefinitions(
    screenWidth: {
      type: "Float!"
      provider: "../providers/ScreenWidth.relayprovider"
    }
    pixelRatio: {
      type: "Float!"
      provider: "../providers/PixelRatio.relayprovider"
    }
  ) {
    image {
      id
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
      id
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

type PhotoWithTextAndTitleRendererProps = ViewProps & {
  /**
   * The data for the PhotoWithTextAndTitle module
   */
  data: PhotoWithTextAndTitleRendererData;
  /**
   * The view mode for the module
   */
  viewMode?: 'desktop' | 'mobile';
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
};

/**
 * Render a PhotoWithTextAndTitle module
 */
const PhotoWithTextAndTitleRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  viewMode,
  ...props
}: PhotoWithTextAndTitleRendererProps) => {
  const {
    image,
    contentFontFamily,
    contentFontColor,
    contentTextAlign,
    contentFontSize,
    contentVerticalSpacing,
    content,
    titleFontFamily,
    titleFontColor,
    titleTextAlign,
    titleFontSize,
    titleVerticalSpacing,
    title,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    gap,
    borderRadius,
    marginHorizontal,
    marginVertical,
    aspectRatio,
    background,
    backgroundStyle,
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

  const os =
    viewMode === 'desktop'
      ? 'web'
      : viewMode === 'mobile'
      ? 'ios'
      : Platform.OS;

  const widthMargin = (layout?.width ?? 0) - 2 * marginHorizontal;
  const imageWidth =
    os === 'web'
      ? widthMargin / 2
      : imageMargin === 'width_full'
      ? layout?.width ?? 0
      : widthMargin;

  const flexDirection =
    os === 'web'
      ? horizontalArrangement === 'left'
        ? 'row'
        : 'row-reverse'
      : verticalArrangement === 'top'
      ? 'column'
      : 'column-reverse';

  return (
    <View
      {...props}
      style={[
        style,
        {
          backgroundColor:
            swapColor(backgroundStyle?.backgroundColor, colorPalette) ??
            colors.white,
        },
      ]}
      onLayout={onLayout}
    >
      {background && (
        <View style={styles.background} pointerEvents="none">
          <SvgUri
            uri={background.uri}
            color={
              swapColor(backgroundStyle?.patternColor, colorPalette) ?? '#000'
            }
            width={layout?.width ?? 0}
            height={layout?.height ?? 0}
            preserveAspectRatio="xMidYMid slice"
          />
        </View>
      )}
      <View
        style={{
          marginVertical,
          flexDirection,
          rowGap: gap,
          columnGap: gap,
          width: os === 'web' ? widthMargin : layout?.width ?? 0,
          marginHorizontal: os === 'web' ? marginHorizontal : 0,
        }}
      >
        <View
          style={{
            marginHorizontal:
              os === 'web'
                ? 0
                : imageMargin === 'width_full'
                ? 0
                : marginHorizontal,
            width: imageWidth,
            aspectRatio,
            borderRadius,
            overflow: 'hidden',
          }}
        >
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={{
                aspectRatio,
                width: imageWidth,
              }}
              resizeMode="cover"
            />
          )}
        </View>

        <View
          style={{
            width: os === 'web' ? widthMargin / 2 - gap : undefined,
            marginHorizontal: os === 'web' ? 0 : marginHorizontal,
          }}
        >
          {title && (
            <Text
              style={{
                textAlign: titleTextAlign as TextStyle['textAlign'],
                fontSize: titleFontSize,
                fontFamily: titleFontFamily,
                color: swapColor(titleFontColor, colorPalette) as ColorValue,
                lineHeight:
                  titleFontSize && titleVerticalSpacing
                    ? titleFontSize * 1.2 + titleVerticalSpacing
                    : undefined,
              }}
            >
              {title}
            </Text>
          )}
          {content && (
            <Text
              style={{
                textAlign: contentTextAlign as TextStyle['textAlign'],
                fontSize: contentFontSize,
                fontFamily: contentFontFamily,
                marginTop: 7,
                color: swapColor(contentFontColor, colorPalette) as ColorValue,
                lineHeight:
                  contentFontSize && contentVerticalSpacing
                    ? contentFontSize * 1.2 + contentVerticalSpacing
                    : undefined,
              }}
            >
              {content}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default PhotoWithTextAndTitleRenderer;

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});
