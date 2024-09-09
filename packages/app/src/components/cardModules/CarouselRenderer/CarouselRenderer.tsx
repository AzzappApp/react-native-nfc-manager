// import { useRef } from 'react';
import { Image } from 'expo-image';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  CAROUSEL_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../CardModuleBackground';
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

type AnimatedProps =
  | 'borderRadius'
  | 'borderWidth'
  | 'gap'
  | 'imageHeight'
  | 'marginHorizontal'
  | 'marginVertical';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const readCarouselData = (module: CarouselRenderer_module$key) =>
  readInlineData(CarouselRendererFragment, module);

export type CarouselViewRendererData = Omit<
  CarouselRenderer_module$data,
  ' $fragmentType'
>;

export type CarouselRendererData = NullableFields<
  Omit<CarouselViewRendererData, AnimatedProps>
>;

type CarouselRendererAnimatedData = {
  [K in AnimatedProps]:
    | CarouselViewRendererData[K]
    | SharedValue<CarouselViewRendererData[K]>;
};

export type CarouselRendererProps = ViewProps & {
  /**
   * The data for the carousel module
   */
  data: CarouselRendererData;
  /**
   * the animated data for the carousel module
   */
  animatedData: CarouselRendererAnimatedData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
};

export type CarouselViewRendererProps = Omit<
  CarouselRendererProps,
  'animatedData' | 'data'
> & {
  data: CarouselViewRendererData;
};

export const CarouselViewRenderer = ({
  data,
  ...rest
}: CarouselViewRendererProps) => {
  const {
    borderRadius,
    borderWidth,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
    ...restData
  } = data;

  return (
    <CarouselRenderer
      {...rest}
      data={restData}
      animatedData={{
        borderRadius,
        borderWidth,
        marginVertical,
        marginHorizontal,
        imageHeight,
        gap,
      }}
    />
  );
};

/**
 *  implementation of the carousel module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
const CarouselRenderer = ({
  data,
  animatedData,
  colorPalette,
  cardStyle,
  style,
  ...props
}: CarouselRendererProps) => {
  const {
    images,
    squareRatio,
    borderColor,
    background,
    backgroundStyle,
    ...rest
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: CAROUSEL_DEFAULT_VALUES,
    styleValuesMap: CAROUSEL_STYLE_VALUES,
  });

  const {
    borderRadius,
    borderWidth,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
  } = animatedData;

  const defaultImageHeight =
    'imageHeight' in rest ? (rest['imageHeight'] as number) : 0;

  const cardModuleBackgroundStyle = useAnimatedStyle(() => {
    const imageHeightValue =
      typeof imageHeight === 'number'
        ? imageHeight
        : imageHeight?.value ?? defaultImageHeight;
    const marginVerticalValue =
      typeof marginVertical === 'number'
        ? marginVertical
        : marginVertical?.value ?? 0;
    const borderWidthValue =
      typeof borderWidth === 'number' ? borderWidth : borderWidth?.value ?? 0;

    return {
      height: imageHeightValue + marginVerticalValue * 2 + borderWidthValue * 2,
    };
  }, [imageHeight, marginVertical, borderWidth]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      paddingVertical:
        typeof marginVertical === 'number'
          ? marginVertical
          : marginVertical?.value ?? 0,
      paddingHorizontal:
        typeof marginHorizontal === 'number'
          ? marginHorizontal
          : marginHorizontal?.value ?? 0,
      columnGap: typeof gap === 'number' ? gap : gap?.value ?? 0,
      height: '100%',
      flexDirection: 'row',
    };
  }, [marginVertical, marginHorizontal, gap]);

  const imageStyle = useAnimatedStyle(
    () => ({
      height:
        typeof imageHeight === 'number'
          ? imageHeight
          : imageHeight?.value ?? defaultImageHeight,
      borderRadius:
        typeof borderRadius === 'number'
          ? borderRadius
          : borderRadius?.value ?? 0,
      borderWidth:
        typeof borderWidth === 'number' ? borderWidth : borderWidth?.value ?? 0,
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
        <Animated.View style={containerStyle}>
          {images?.map(image => (
            <AnimatedImage
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
        </Animated.View>
      </ScrollView>
    </CardModuleBackground>
  );
};

export default CarouselRenderer;
