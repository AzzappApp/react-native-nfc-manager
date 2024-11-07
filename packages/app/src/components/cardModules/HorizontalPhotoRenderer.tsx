import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  HORIZONTAL_PHOTO_STYLE_VALUES,
  getHorizontalPhotoDefaultValues,
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

type AnimatedProps =
  | 'borderRadius'
  | 'borderWidth'
  | 'imageHeight'
  | 'marginHorizontal'
  | 'marginVertical';

export const readHorizontalPhotoData = (
  module: HorizontalPhotoRenderer_module$key,
) => readInlineData(HorizontalPhotoRendererFragment, module);

export type HorizontalPhotoRendererData = NullableFields<
  Omit<HorizontalPhotoRenderer_module$data, ' $fragmentType'>
>;

type HorizontalPhotoRendererAnimatedData = {
  [K in AnimatedProps]: SharedValue<
    NonNullable<HorizontalPhotoRendererData[K]>
  >;
};

export type HorizontalPhotoRendererProps = ViewProps & {
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
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
} & (
    | {
        /**
         * The data for the BlockText module
         */
        data: Omit<HorizontalPhotoRendererData, AnimatedProps>;
        /**
         * The animated data for the BlockText module
         */
        animatedData: HorizontalPhotoRendererAnimatedData;
      }
    | {
        /**
         * The data for the HorizontalPhoto module
         */
        data: HorizontalPhotoRendererData;
        animatedData: null;
      }
  );

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
  coverBackgroundColor,
  ...props
}: HorizontalPhotoRendererProps) => {
  const { borderColor, background, backgroundStyle, image, ...rest } =
    getModuleDataValues({
      data,
      cardStyle,
      defaultValues: getHorizontalPhotoDefaultValues(coverBackgroundColor),
      styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    });

  const containerStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('imageHeight' in rest) {
        return {
          height: rest.imageHeight,
          borderWidth: rest.borderWidth ?? 0,
          borderRadius: rest.borderRadius ?? 0,
          marginHorizontal: rest.marginHorizontal,
          marginVertical: rest.marginVertical,
        };
      }

      return {};
    }

    return {
      height: animatedData.imageHeight.value,
      borderWidth: animatedData.borderWidth.value ?? 0,
      borderRadius: animatedData.borderRadius.value ?? 0,
      marginHorizontal: animatedData.marginHorizontal.value,
      marginVertical: animatedData.marginVertical.value,
    };
  });

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
            contentFit="cover"
          />
        </Animated.View>
      )}
    </CardModuleBackground>
  );
};

export default HorizontalPhotoRenderer;
