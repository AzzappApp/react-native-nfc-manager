import { Image, ScrollView } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { CAROUSEL_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type {
  CarouselRenderer_module$data,
  CarouselRenderer_module$key,
} from '@azzapp/relay/artifacts/CarouselRenderer_module.graphql';
import type { ViewProps } from 'react-native';

export type CarouselRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a Carousel module
   */
  module: CarouselRenderer_module$key;
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
        borderSize
        borderColor
        borderRadius
        marginVertical
        marginHorizontal
        imageHeight
        gap
        background {
          uri
        }
        backgroundStyle {
          backgroundColor
          patternColor
          opacity
        }
      }
    `,
    module,
  );
  return <CarouselRendererRaw data={data} {...props} />;
};

export default CarouselRenderer;

export type CarouselRawData = Omit<
  CarouselRenderer_module$data,
  ' $fragmentType'
>;

type CarouselRendererRawProps = ViewProps & {
  /**
   * The data for the carousel module
   */
  data: CarouselRawData;
};

/**
 * Raw implementation of the carousel module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const CarouselRendererRaw = ({
  data,
  style,
  ...props
}: CarouselRendererRawProps) => {
  const {
    images,
    squareRatio,
    borderSize,
    borderColor,
    borderRadius,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
    background,
    backgroundStyle,
  } = Object.assign({}, CAROUSEL_DEFAULT_VALUES, data);

  const height = imageHeight + marginVertical * 2 + borderSize * 2;
  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundOpacity={backgroundStyle?.opacity}
      backgroundColor={backgroundStyle?.backgroundColor}
      patternColor={backgroundStyle?.patternColor}
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
        {images?.map(image => (
          <Image
            key={image.id}
            source={{ uri: image.uri }}
            style={{
              height: imageHeight + borderSize * 2,
              borderRadius,
              borderColor,
              borderWidth: borderSize,
              aspectRatio: squareRatio ? 1 : image.aspectRatio,
              resizeMode: 'cover',
            }}
          />
        ))}
      </ScrollView>
    </CardModuleBackground>
  );
};
