import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
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
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

const PhotoWithTextAndTitleRendererFragment = graphql`
  fragment PhotoWithTextAndTitleRenderer_module on CardModulePhotoWithTextAndTitle
  @inline
  @argumentDefinitions(
    screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
    pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
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

const animatedProps = [
  'contentFontSize',
  'contentVerticalSpacing',
  'titleFontSize',
  'titleVerticalSpacing',
  'gap',
  'borderRadius',
  'marginHorizontal',
  'marginVertical',
  'aspectRatio',
] as const;

type AnimatedProps = (typeof animatedProps)[number];

export type PhotoWithTextAndTitleViewRendererData = Omit<
  PhotoWithTextAndTitleRenderer_module$data,
  ' $fragmentType'
>;

export type PhotoWithTextAndTitleRendererData = NullableFields<
  Omit<PhotoWithTextAndTitleViewRendererData, AnimatedProps>
>;

type PhotoWithTextAndTitleRendererAnimatedData = {
  [K in AnimatedProps]:
    | PhotoWithTextAndTitleViewRendererData[K]
    | SharedValue<PhotoWithTextAndTitleViewRendererData[K]>;
};

export type PhotoWithTextAndTitleRendererProps = ViewProps & {
  /**
   * The data for the PhotoWithTextAndTitle module
   */
  data: PhotoWithTextAndTitleRendererData;
  /**
   * The animated data for the PhotoWithTextAndTitle module
   */
  animatedData: PhotoWithTextAndTitleRendererAnimatedData;
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

export type PhotoWithTextAndTitleViewRendererProps = Omit<
  PhotoWithTextAndTitleRendererProps,
  'animatedData' | 'data'
> & {
  data: PhotoWithTextAndTitleViewRendererData;
};

export const PhotoWithTextAndTitleViewRenderer = ({
  data,
  ...rest
}: PhotoWithTextAndTitleViewRendererProps) => {
  const {
    contentFontSize,
    contentVerticalSpacing,
    titleFontSize,
    titleVerticalSpacing,
    gap,
    borderRadius,
    marginHorizontal,
    marginVertical,
    aspectRatio,
    ...restData
  } = data;

  return (
    <PhotoWithTextAndTitleRenderer
      {...rest}
      data={restData}
      animatedData={{
        contentFontSize,
        contentVerticalSpacing,
        titleFontSize,
        titleVerticalSpacing,
        gap,
        borderRadius,
        marginHorizontal,
        marginVertical,
        aspectRatio,
      }}
    />
  );
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

  const {
    contentFontSize,
    contentVerticalSpacing,
    titleFontSize,
    titleVerticalSpacing,
    gap,
    borderRadius,
    marginHorizontal,
    marginVertical,
    aspectRatio,
  } = props.animatedData;

  const widthMargin = useDerivedValue(
    () =>
      (layout?.width ?? 0) -
      2 *
        (typeof marginHorizontal === 'number'
          ? marginHorizontal
          : marginHorizontal?.value ?? 0),
    [layout?.width, marginHorizontal],
  );
  const imageWidth = useDerivedValue(
    () =>
      os === 'web'
        ? widthMargin.value / 2
        : imageMargin === 'width_full'
          ? layout?.width ?? 0
          : widthMargin.value,
    [layout?.width, imageMargin, widthMargin],
  );

  const flexDirection =
    os === 'web'
      ? horizontalArrangement === 'left'
        ? 'row'
        : 'row-reverse'
      : verticalArrangement === 'top'
        ? 'column'
        : 'column-reverse';

  const containerStyle = useAnimatedStyle(() => {
    const gapValue = typeof gap === 'number' ? gap : gap?.value ?? 0;
    return {
      flexDirection,
      rowGap: gapValue,
      columnGap: gapValue,
      width: os === 'web' ? widthMargin.value : layout?.width ?? 0,
      marginHorizontal:
        os === 'web'
          ? typeof marginHorizontal === 'number'
            ? marginHorizontal
            : marginHorizontal?.value ?? 0
          : 0,
    };
  }, [gap, layout?.width, marginHorizontal]);

  const imageContainerStyle = useAnimatedStyle(() => {
    return {
      marginVertical: typeof marginVertical === 'number' ? marginVertical : 0,
      marginHorizontal:
        os === 'web'
          ? 0
          : imageMargin === 'width_full'
            ? 0
            : typeof marginHorizontal === 'number'
              ? marginHorizontal
              : marginHorizontal?.value ?? 0,
      aspectRatio:
        typeof aspectRatio === 'number' ? aspectRatio : aspectRatio?.value ?? 1,
      width: imageWidth.value,
      borderRadius:
        typeof borderRadius === 'number'
          ? borderRadius
          : borderRadius?.value ?? 0,
      overflow: 'hidden',
    };
  }, [
    aspectRatio,
    borderRadius,
    imageWidth,
    imageMargin,
    marginHorizontal,
    marginVertical,
  ]);

  const imageStyle = useAnimatedStyle(() => {
    return {
      aspectRatio:
        typeof aspectRatio === 'number' ? aspectRatio : aspectRatio?.value ?? 1,
      width: imageWidth.value,
    };
  }, [aspectRatio, imageWidth]);

  const textContainerStyle = useAnimatedStyle(() => {
    return {
      width:
        os === 'web'
          ? widthMargin.value / 2 -
            (typeof gap === 'number' ? gap : gap?.value ?? 0)
          : undefined,
      marginHorizontal:
        os === 'web'
          ? 0
          : typeof marginHorizontal === 'number'
            ? marginHorizontal
            : marginHorizontal?.value ?? 0,
      justifyContent: viewMode === 'desktop' ? 'center' : undefined,
    };
  }, [marginHorizontal, gap, widthMargin, viewMode]);

  const titleStyle = useAnimatedStyle(() => {
    const titleFontSizeValue =
      typeof titleFontSize === 'number'
        ? titleFontSize
        : titleFontSize?.value ?? undefined;
    const titleVerticalSpacingValue =
      typeof titleVerticalSpacing === 'number'
        ? titleVerticalSpacing
        : titleVerticalSpacing?.value ?? undefined;
    return {
      fontSize: titleFontSizeValue,
      lineHeight:
        titleFontSizeValue && titleVerticalSpacingValue
          ? titleFontSizeValue * 1.2 + titleVerticalSpacingValue
          : undefined,
    };
  }, [titleFontSize, titleVerticalSpacing]);

  const contentStyle = useAnimatedStyle(() => {
    const contentFontSizeValue =
      typeof contentFontSize === 'number'
        ? contentFontSize
        : contentFontSize?.value ?? undefined;
    const contentVerticalSpacingValue =
      typeof contentVerticalSpacing === 'number'
        ? contentVerticalSpacing
        : contentVerticalSpacing?.value ?? undefined;
    return {
      fontSize: contentFontSizeValue,
      lineHeight:
        contentFontSizeValue && contentVerticalSpacingValue
          ? contentFontSizeValue * 1.2 + contentVerticalSpacingValue
          : undefined,
    };
  }, [contentFontSize, contentVerticalSpacing]);

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
      <Animated.View style={containerStyle}>
        <Animated.View style={imageContainerStyle}>
          {image && (
            <Animated.Image
              source={{ uri: image.uri }}
              style={imageStyle}
              resizeMode="cover"
            />
          )}
        </Animated.View>

        <Animated.View style={textContainerStyle}>
          {title && (
            <Animated.Text
              style={[
                titleStyle,
                {
                  textAlign: titleTextAlign as TextStyle['textAlign'],
                  fontFamily: titleFontFamily,
                  color: swapColor(titleFontColor, colorPalette) as ColorValue,
                },
              ]}
            >
              {title}
            </Animated.Text>
          )}
          {content && (
            <Animated.Text
              style={[
                contentStyle,
                {
                  textAlign: contentTextAlign as TextStyle['textAlign'],
                  fontFamily: contentFontFamily,
                  marginTop: 7,
                  color: swapColor(
                    contentFontColor,
                    colorPalette,
                  ) as ColorValue,
                },
              ]}
            >
              {content}
            </Animated.Text>
          )}
        </Animated.View>
      </Animated.View>
    </CardModuleBackground>
  );
};

export default PhotoWithTextAndTitleRenderer;
