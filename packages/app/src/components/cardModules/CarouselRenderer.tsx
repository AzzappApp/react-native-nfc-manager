// import { useRef } from 'react';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  CAROUSEL_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type {
  CarouselRenderer_module$data,
  CarouselRenderer_module$key,
} from '#relayArtifacts/CarouselRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

/**
 * Render a carousel module
 */
const CarouselRendererFragment = graphql`
  fragment CarouselRenderer_module on CardModuleCarousel
  @inline
  @argumentDefinitions(
    screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
    pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
  ) {
    images {
      id
      uri(width: $screenWidth, pixelRatio: $pixelRatio)
      aspectRatio
    }
    squareRatio
    borderWidth
    borderColor
    borderRadius
    marginVertical
    marginHorizontal
    imageHeight
    gap
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

export const readCarouselData = (module: CarouselRenderer_module$key) =>
  readInlineData(CarouselRendererFragment, module);

export type CarouselRendererData = NullableFields<
  Omit<CarouselRenderer_module$data, ' $fragmentType'>
>;

export type CarouselRendererProps = ViewProps & {
  /**
   * The data for the carousel module
   */
  data: CarouselRendererData;
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
};

/**
 *  implementation of the carousel module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
const CarouselRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  coverBackgroundColor,
  ...props
}: CarouselRendererProps) => {
  const {
    images,
    squareRatio,
    borderColor,
    background,
    backgroundStyle,
    borderRadius,
    borderWidth,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: CAROUSEL_DEFAULT_VALUES,
    styleValuesMap: CAROUSEL_STYLE_VALUES,
  });

  const cardModuleBackgroundStyle = useMemo(() => {
    return {
      height: imageHeight + marginVertical * 2,
    };
  }, [imageHeight, marginVertical]);

  const containerStyle = useMemo(() => {
    return {
      paddingVertical: marginVertical,
      paddingHorizontal: marginHorizontal,
      columnGap: gap,
      height: '100%',
      flexDirection: 'row',
    } as const;
  }, [marginHorizontal, marginVertical, gap]);

  const imageStyle = useMemo(
    () => ({
      height: imageHeight,
      borderRadius,
      borderWidth,
    }),
    [imageHeight, borderRadius, borderWidth],
  );

  // const modal = useRef<CarouselFullscrenActions>(null);

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
      style={[cardModuleBackgroundStyle, style]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: '100%' }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View style={containerStyle}>
          {images?.map(image => (
            <Image
              key={image.id}
              source={{ uri: image.uri }}
              style={[
                imageStyle,
                {
                  borderColor: swapColor(borderColor, colorPalette),
                  aspectRatio: squareRatio ? 1 : image.aspectRatio,
                  resizeMode: 'cover',
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </CardModuleBackground>
  );
};

export default CarouselRenderer;
