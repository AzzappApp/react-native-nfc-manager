// import { useRef } from 'react';
import { Image, ScrollView } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  CAROUSEL_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
// import PressableNative from '#ui/PressableNative';
import CardModuleBackground from '../CardModuleBackground';
// import CarouselFullscreen from './CarouselFullscreen';
// import type { CarouselFullscrenActions } from './CarouselFullscreen';
import type {
  CarouselRenderer_module$data,
  CarouselRenderer_module$key,
} from '#relayArtifacts/CarouselRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { ViewProps } from 'react-native';

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

type CarouselRendererProps = ViewProps & {
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
  ...props
}: CarouselRendererProps) => {
  const {
    images,
    squareRatio,
    borderWidth,
    borderColor,
    borderRadius,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
    background,
    backgroundStyle,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: CAROUSEL_DEFAULT_VALUES,
    styleValuesMap: CAROUSEL_STYLE_VALUES,
  });

  const height = imageHeight + marginVertical * 2 + borderWidth * 2;
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
      style={[{ height }, style]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: '100%' }}
        contentContainerStyle={{
          paddingVertical: marginVertical,
          paddingHorizontal: marginHorizontal,
          columnGap: gap,
          height: '100%',
        }}
      >
        {/** Disabled For beta */}
        {/* {images?.map((image, i) => (
          <PressableNative
            key={image.id}
            onPress={() => modal.current?.open(i)}
            accessibilityRole="alert"
          >
            <Image
              key={image.id}
              source={{ uri: image.uri }}
              style={{
                height: imageHeight + borderWidth * 2,
                borderRadius,
                borderColor: swapColor(borderColor, colorPalette),
                borderWidth,
                aspectRatio: squareRatio ? 1 : image.aspectRatio,
                resizeMode: 'cover',
              }}
            />
          </PressableNative>
        ))} */}
        {images?.map(image => (
          <Image
            key={image.id}
            source={{ uri: image.uri }}
            style={{
              height: imageHeight + borderWidth * 2,
              borderRadius,
              borderColor: swapColor(borderColor, colorPalette),
              borderWidth,
              aspectRatio: squareRatio ? 1 : image.aspectRatio,
              resizeMode: 'cover',
            }}
          />
        ))}
      </ScrollView>
      {/** Disabled for beta */}
      {/* <CarouselFullscreen
        ref={modal}
        images={images}
        borderColor={borderColor}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        squareRatio={squareRatio}
      /> */}
    </CardModuleBackground>
  );
};

export default CarouselRenderer;
