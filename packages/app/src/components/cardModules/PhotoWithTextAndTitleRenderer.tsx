import { Image } from 'expo-image';
import { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  getModuleDataValues,
  getPhotoWithTextAndTitleDefaultValues,
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
import type { SharedValue } from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

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

type AnimatedProps =
  | 'aspectRatio'
  | 'borderRadius'
  | 'contentFontSize'
  | 'contentVerticalSpacing'
  | 'gap'
  | 'marginHorizontal'
  | 'marginVertical'
  | 'titleFontSize'
  | 'titleVerticalSpacing';

export type PhotoWithTextAndTitleRendererData = NullableFields<
  Omit<PhotoWithTextAndTitleRenderer_module$data, ' $fragmentType'>
>;

type PhotoWithTextAndTitleRendererAnimatedData = {
  [K in AnimatedProps]: SharedValue<
    NonNullable<PhotoWithTextAndTitleRendererData[K]>
  >;
};

export type PhotoWithTextAndTitleRendererProps = ViewProps & {
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
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
} & (
    | {
        /**
         * The data for the PhotoWithTextAndTitle module
         */
        data: Omit<PhotoWithTextAndTitleRendererData, AnimatedProps>;
        /**
         * The animated data for the PhotoWithTextAndTitle module
         */
        animatedData: PhotoWithTextAndTitleRendererAnimatedData;
      }
    | {
        /**
         * The data for the PhotoWithTextAndTitle module
         */
        data: PhotoWithTextAndTitleRendererData;
        /**
         * The animated data for the PhotoWithTextAndTitle module
         */
        animatedData: null;
      }
  );

/**
 * Render a PhotoWithTextAndTitle module
 */
const PhotoWithTextAndTitleRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  animatedData,
  viewMode,
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
    ...rest
  } = getModuleDataValues({
    data,
    cardStyle,
    styleValuesMap: PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
    defaultValues: getPhotoWithTextAndTitleDefaultValues(coverBackgroundColor),
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

  const widthMargin = useDerivedValue(
    () =>
      (layout?.width ?? 0) -
      2 *
        (animatedData === null
          ? 'marginHorizontal' in rest
            ? rest.marginHorizontal
            : 0
          : (animatedData?.marginHorizontal.value ?? 0)),
  );

  const imageWidth = useDerivedValue(() =>
    os === 'web'
      ? widthMargin.value / 2
      : imageMargin === 'width_full'
        ? (layout?.width ?? 0)
        : widthMargin.value,
  );

  const flexDirection: ViewStyle['flexDirection'] =
    os === 'web'
      ? horizontalArrangement === 'left'
        ? 'row'
        : 'row-reverse'
      : verticalArrangement === 'top'
        ? 'column'
        : 'column-reverse';

  const containerStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('gap' in rest) {
        return {
          marginVertical: rest.marginVertical,
          flexDirection,
          rowGap: rest.gap ?? 0,
          columnGap: rest.gap ?? 0,
          width: os === 'web' ? widthMargin.value : (layout?.width ?? 0),
          marginHorizontal: os === 'web' ? (rest.marginHorizontal ?? 0) : 0,
        };
      }
      return {
        marginHorizontal: 0,
      };
    }
    const gapValue = animatedData.gap.value ?? 0;
    return {
      marginVertical: animatedData.marginVertical.value,
      flexDirection,
      rowGap: gapValue,
      columnGap: gapValue,
      width: os === 'web' ? widthMargin.value : (layout?.width ?? 0),
      marginHorizontal:
        os === 'web' ? (animatedData.marginHorizontal.value ?? 0) : 0,
    };
  });

  const imageContainerStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      return {
        marginHorizontal:
          'marginHorizontal' in rest && imageMargin !== 'width_full'
            ? rest.marginHorizontal
            : 0,
        borderRadius: 'borderRadius' in rest ? rest.borderRadius : 0,
      };
    }

    return {
      marginHorizontal:
        os === 'web'
          ? 0
          : imageMargin === 'width_full'
            ? 0
            : animatedData.marginHorizontal.value,
      aspectRatio: animatedData.aspectRatio.value ?? 1,
      borderRadius: animatedData.borderRadius.value ?? 0,
    };
  });

  const imageStyle = useAnimatedStyle(() =>
    animatedData === null
      ? 'aspectRatio' in rest
        ? {
            aspectRatio: rest.aspectRatio ?? 1,
            width: imageWidth.value,
          }
        : { width: imageWidth.value }
      : {
          aspectRatio: animatedData.aspectRatio.value ?? 1,
          width: imageWidth.value,
        },
  );

  const textContainerStyle = useAnimatedStyle(() => {
    return animatedData === null
      ? 'marginHorizontal' in rest
        ? {
            width:
              os === 'web'
                ? widthMargin.value / 2 - (rest.gap ?? 0)
                : undefined,
            marginHorizontal: os === 'web' ? 0 : (rest.marginHorizontal ?? 0),
            justifyContent: viewMode === 'desktop' ? 'center' : undefined,
          }
        : {}
      : {
          width:
            os === 'web'
              ? widthMargin.value / 2 - (animatedData?.gap.value ?? 0)
              : undefined,
          marginHorizontal:
            os === 'web' ? 0 : (animatedData?.marginHorizontal.value ?? 0),
          justifyContent: viewMode === 'desktop' ? 'center' : undefined,
        };
  });

  const titleStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('titleFontSize' in rest) {
        return {
          lineHeight:
            rest.titleFontSize && rest.titleVerticalSpacing
              ? rest.titleFontSize * 1.2 + rest.titleVerticalSpacing
              : undefined,
          fontSize: rest.titleFontSize,
        };
      }
      return {};
    }

    const fontSizeValue = animatedData.titleFontSize.value;
    const verticalSpacingValue = animatedData.titleVerticalSpacing.value;
    return {
      fontSize: fontSizeValue ?? undefined,
      lineHeight:
        fontSizeValue && verticalSpacingValue
          ? fontSizeValue * 1.2 + verticalSpacingValue
          : undefined,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('contentFontSize' in rest) {
        return {
          lineHeight:
            rest.contentFontSize && rest.contentVerticalSpacing
              ? rest.contentFontSize * 1.2 + rest.contentVerticalSpacing
              : undefined,
          fontSize: rest.contentFontSize,
        };
      }
      return {};
    }

    const fontSizeValue = animatedData.contentFontSize.value;
    const verticalSpacingValue = animatedData.contentVerticalSpacing.value;
    return {
      fontSize: fontSizeValue ?? undefined,
      lineHeight:
        fontSizeValue && verticalSpacingValue
          ? fontSizeValue * 1.2 + verticalSpacingValue
          : undefined,
    };
  });

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
      <Animated.View style={containerStyle}>
        <Animated.View style={[imageContainerStyle, { overflow: 'hidden' }]}>
          {image && (
            <AnimatedImage
              source={{ uri: image.uri }}
              style={imageStyle}
              contentFit="cover"
            />
          )}
        </Animated.View>

        <Animated.View style={textContainerStyle}>
          {title !== '' && (
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
              {title ??
                intl.formatMessage({
                  defaultMessage: 'Add section Title here',
                  description: 'PhotoWithTextAndTitle default module title',
                })}
            </Animated.Text>
          )}

          {content !== '' && (
            <Animated.Text
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
            </Animated.Text>
          )}
        </Animated.View>
      </Animated.View>
    </CardModuleBackground>
  );
};

export default PhotoWithTextAndTitleRenderer;
