import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CarouselRendererData } from './CarouselRenderer';

type CarouselImageProps = {
  image: Exclude<CarouselRendererData['images'], null>[number];
  borderWidth: number;
  borderRadius: number;
  borderColor: string;
  squareRatio: boolean;
  index: number;
  displayedImage: number;
};

const CarouselImage = (props: CarouselImageProps) => {
  const {
    image,
    borderWidth,
    borderColor,
    borderRadius,
    squareRatio,
    index,
    displayedImage,
  } = props;

  const { width } = useWindowDimensions();
  const offset = useSharedValue(displayedImage);

  const floating = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(width * (index - offset.value), {
            duration: 500,
            easing: Easing.out(Easing.exp),
          }),
        },
      ],
    };
  });

  useEffect(() => {
    offset.value = displayedImage;
  }, [displayedImage, offset]);

  return (
    <Animated.Image
      key={image.id}
      source={{ uri: image.uri }}
      style={[
        {
          maxWidth: width - 50,
          maxHeight: '100%',
          width: image.aspectRatio >= 1 ? '100%' : undefined,
          height: image.aspectRatio < 1 ? '100%' : undefined,
          borderRadius,
          borderColor,
          borderWidth,
          aspectRatio: squareRatio ? 1 : image.aspectRatio,
          position: 'absolute',
          left: 25,
        },
        floating,
      ]}
    />
  );
};

export default CarouselImage;
