import { Skia } from '@shopify/react-native-skia';
import { Easing, interpolate } from 'react-native-reanimated';
import { easeAppearDisappear } from '../coverDrawerHelpers';
import type { OverlayAnimation } from './overlayAnimations';

const fadeInOut: OverlayAnimation = progress => {
  'worklet';
  progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));
  const opacity = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return {
    animatePaint: paint => {
      'worklet';
      paint.setAlphaf(opacity);
    },
    animateImageFilter: imageFilter => {
      /* prettier-ignore*/
      return Skia.ImageFilter.MakeColorFilter(
        Skia.ColorFilter.MakeMatrix([
          1, 0, 0, 0, 0, // Red
          0, 1, 0, 0, 0, // Green
          0, 0, 1, 0, 0, // Blue
          0, 0, 0, opacity, 0, // Alpha (opacity adjustment)
        ]),
        imageFilter,
      );
    },
  };
};

export default fadeInOut;
