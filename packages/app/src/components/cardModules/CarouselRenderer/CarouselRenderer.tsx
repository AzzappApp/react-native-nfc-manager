import { useRef } from 'react';
import { Image, ScrollView } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  CAROUSEL_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import PressableNative from '#ui/PressableNative';
import CardModuleBackground from '../CardModuleBackground';
import CarouselFullscreen from './CarouselFullscreen';
import type { CarouselFullscrenActions } from './CarouselFullscreen';
import type {
  CarouselRenderer_module$data,
  CarouselRenderer_module$key,
} from '@azzapp/relay/artifacts/CarouselRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { ViewProps } from 'react-native';

export type CarouselRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a Carousel module
   */
  module: CarouselRenderer_module$key;
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
 * Render a carousel module
 */
const CarouselRenderer = ({ module, ...props }: CarouselRendererProps) => {
  const data = useFragment(
    graphql`
      fragment CarouselRenderer_module on CardModuleCarousel
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
    `,
    module,
  );
  return <CarouselRendererRaw data={data} {...props} />;
};

export default CarouselRenderer;

export type CarouselRawData = NullableFields<
  Omit<CarouselRenderer_module$data, ' $fragmentType'>
>;

type CarouselRendererRawProps = ViewProps & {
  /**
   * The data for the carousel module
   */
  data: CarouselRawData;
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
 * Raw implementation of the carousel module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const CarouselRendererRaw = ({
  data,
  colorPalette,
  cardStyle,
  style,
  ...props
}: CarouselRendererRawProps) => {
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
  const modal = useRef<CarouselFullscrenActions>(null);

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
        {images?.map((image, i) => (
          <PressableNative
            key={image.id}
            // style={[styles.root, style]}
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
        ))}
      </ScrollView>
      <CarouselFullscreen
        ref={modal}
        images={images}
        borderColor={borderColor}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        squareRatio={squareRatio}
      />
    </CardModuleBackground>
  );
};
