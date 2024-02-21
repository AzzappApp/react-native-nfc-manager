import { Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type {
  HorizontalPhotoRenderer_module$data,
  HorizontalPhotoRenderer_module$key,
} from '#relayArtifacts/HorizontalPhotoRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

const HorizontalPhotoRendererFragment = graphql`
  fragment HorizontalPhotoRenderer_module on CardModuleHorizontalPhoto
  @inline
  @argumentDefinitions(
    screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
    pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
  ) {
    borderWidth
    borderRadius
    borderColor
    marginHorizontal
    marginVertical
    imageHeight
    background {
      id
      uri
      resizeMode
    }
    backgroundStyle {
      backgroundColor
      patternColor
    }
    image {
      id
      uri(width: $screenWidth, pixelRatio: $pixelRatio)
    }
  }
`;

const animatedProps = [
  'borderWidth',
  'borderRadius',
  'marginHorizontal',
  'marginVertical',
  'imageHeight',
] as const;

type AnimatedProps = (typeof animatedProps)[number];

export const readHorizontalPhotoData = (
  module: HorizontalPhotoRenderer_module$key,
) => readInlineData(HorizontalPhotoRendererFragment, module);

export type HorizontalPhotoViewRendererData = Omit<
  HorizontalPhotoRenderer_module$data,
  ' $fragmentType'
>;

export type HorizontalPhotoRendererData = NullableFields<
  Omit<HorizontalPhotoViewRendererData, AnimatedProps>
>;

export type HorizontalPhotoViewRendererProps = Omit<
  HorizontalPhotoRendererProps,
  'animatedData' | 'data'
> & {
  data: HorizontalPhotoViewRendererData;
};

type HorizontalPhotoRendererAnimatedData = {
  [K in AnimatedProps]:
    | HorizontalPhotoViewRendererData[K]
    | SharedValue<HorizontalPhotoViewRendererData[K]>;
};

export type HorizontalPhotoRendererProps = ViewProps & {
  /**
   * The data for the HorizontalPhoto module
   */
  data: HorizontalPhotoRendererData;
  /**
   * The animated data for the HorizontalPhoto module
   */
  animatedData: HorizontalPhotoRendererAnimatedData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * The wrapped content style
   */
  contentStyle?: StyleProp<ViewStyle>;
};

export const HorizontalPhotoViewRenderer = ({
  data,
  ...rest
}: HorizontalPhotoViewRendererProps) => {
  const {
    borderWidth,
    borderRadius,
    marginHorizontal,
    marginVertical,
    imageHeight,
    ...restData
  } = data;

  return (
    <HorizontalPhotoRenderer
      {...rest}
      data={restData}
      animatedData={{
        borderWidth,
        borderRadius,
        marginHorizontal,
        marginVertical,
        imageHeight,
      }}
    />
  );
};

/**
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = ({
  data,
  animatedData,
  colorPalette,
  cardStyle,
  style,
  contentStyle,
  ...props
}: HorizontalPhotoRendererProps) => {
  const { borderColor, background, backgroundStyle, image } =
    getModuleDataValues({
      data,
      cardStyle,
      defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
      styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    });

  const {
    borderWidth,
    borderRadius,
    marginHorizontal,
    marginVertical,
    imageHeight,
  } = animatedData;

  const containerStyle = useAnimatedStyle(() => {
    return {
      height:
        typeof imageHeight === 'number' ? imageHeight : imageHeight?.value ?? 0,
      borderWidth:
        typeof borderWidth === 'number' ? borderWidth : borderWidth?.value ?? 0,
      borderRadius:
        typeof borderRadius === 'number'
          ? borderRadius
          : borderRadius?.value ?? 0,
      marginHorizontal:
        typeof marginHorizontal === 'number'
          ? marginHorizontal
          : marginHorizontal?.value ?? 0,
      marginVertical:
        typeof marginVertical === 'number'
          ? marginVertical
          : marginVertical?.value ?? 0,
    };
  }, [
    imageHeight,
    marginVertical,
    marginHorizontal,
    borderRadius,
    borderWidth,
  ]);

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
    >
      {image?.uri && (
        <Animated.View
          style={[
            {
              borderColor: swapColor(borderColor, colorPalette),
              overflow: 'hidden',
            },
            containerStyle,
            contentStyle,
          ]}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </CardModuleBackground>
  );
};

export default HorizontalPhotoRenderer;
