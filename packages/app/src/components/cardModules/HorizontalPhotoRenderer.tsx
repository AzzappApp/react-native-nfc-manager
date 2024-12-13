import { Image } from 'expo-image';
import { useMemo } from 'react';
import {
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
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

export const readHorizontalPhotoData = (
  module: HorizontalPhotoRenderer_module$key,
) => readInlineData(HorizontalPhotoRendererFragment, module);

export type HorizontalPhotoRendererData = NullableFields<
  Omit<HorizontalPhotoRenderer_module$data, ' $fragmentType'>
>;

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

  /**
   * The data for the module
   */
  data: HorizontalPhotoRendererData;
};

/**
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  contentStyle,
  coverBackgroundColor,
  ...props
}: HorizontalPhotoRendererProps) => {
  const {
    borderColor,
    background,
    backgroundStyle,
    image,
    imageHeight,
    borderWidth,
    borderRadius,
    marginHorizontal,
    marginVertical,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
    styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
  });

  const containerStyle = useMemo(() => {
    return {
      height: imageHeight,
      borderWidth,
      borderRadius,
      marginHorizontal,
      marginVertical,
    };
  }, [
    imageHeight,
    borderWidth,
    borderRadius,
    marginHorizontal,
    marginVertical,
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
        <View
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
        </View>
      )}
    </CardModuleBackground>
  );
};

export default HorizontalPhotoRenderer;
