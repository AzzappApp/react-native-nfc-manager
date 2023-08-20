import { View, Image } from 'react-native';
import { graphql, useFragment } from 'react-relay';
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
} from '@azzapp/relay/artifacts/HorizontalPhotoRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { ViewProps } from 'react-native';

export type HorizontalPhotoRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a HorizontalPhoto module
   */
  module: HorizontalPhotoRenderer_module$key;
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
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = ({
  module,
  ...props
}: HorizontalPhotoRendererProps) => {
  const data = useFragment(
    graphql`
      fragment HorizontalPhotoRenderer_module on CardModuleHorizontalPhoto
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
    `,
    module,
  );

  return <HorizontalPhotoRendererRaw data={data} {...props} />;
};

export default HorizontalPhotoRenderer;

export type HorizontalPhotoRawData = NullableFields<
  Omit<HorizontalPhotoRenderer_module$data, ' $fragmentType'>
>;

type HorizontalPhotoRendererRawProps = ViewProps & {
  /**
   * The data for the HorizontalPhoto module
   */
  data: HorizontalPhotoRawData;
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
 * Raw implementation of the HorizontalPhoto module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const HorizontalPhotoRendererRaw = ({
  data,
  colorPalette,
  cardStyle,
  style,
  ...props
}: HorizontalPhotoRendererRawProps) => {
  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    background,
    backgroundStyle,
    imageHeight,
    image,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
    styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
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
      style={style}
    >
      {image?.uri && (
        <View
          style={{
            height: imageHeight,
            borderWidth,
            borderRadius,
            marginHorizontal,
            marginVertical,
            borderColor: swapColor(borderColor, colorPalette),
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        </View>
      )}
    </CardModuleBackground>
  );
};
