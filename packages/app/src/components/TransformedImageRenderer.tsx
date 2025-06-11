import { Canvas, Image, Skia } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { useDerivedValue, type DerivedValue } from 'react-native-reanimated';
import { colors } from '#theme';
import {
  transformImage,
  useLutTexture,
  type EditionParameters,
} from '#helpers/mediaEditions';
import { drawOffScreen, useOffScreenSurface } from '#helpers/skiaHelpers';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkImage } from '@shopify/react-native-skia';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

export type TransformedImageRendererProps = Pick<ViewProps, 'testID'> & {
  image: DerivedValue<SkImage | null>;
  editionParameters?: EditionParameters | null;
  filter?: Filter | null;
  width: number;
  height: number;
  imageStyle?: StyleProp<ViewStyle>;
};

const TransformedImageRenderer = ({
  image: imageSharedValue,
  editionParameters,
  filter,
  width,
  height,
  imageStyle,
  ...props
}: TransformedImageRendererProps) => {
  const lutTexture = useLutTexture(filter);

  const surface = useOffScreenSurface(width, height);

  const transformedImage = useDerivedValue(() => {
    const image = imageSharedValue.value;
    if (!image) {
      return null;
    }
    return drawOffScreen(surface, (canvas, width, height) => {
      'worklet';
      canvas.clear(Skia.Color('#00000000'));
      const imageFilter = transformImage({
        image,
        imageInfo: {
          width: image.width(),
          height: image.height(),
          matrix: Skia.Matrix(),
        },
        targetWidth: width,
        targetHeight: height,
        editionParameters,
        lutTexture,
      });
      const paint = Skia.Paint();
      paint.setImageFilter(imageFilter);
      canvas.drawRect(
        {
          x: 0,
          y: 0,
          width,
          height,
        },
        paint,
      );
    });
  });

  return (
    <Canvas style={[styles.picture, { width, height }, imageStyle]} {...props}>
      <Image
        x={0}
        y={0}
        width={width}
        height={height}
        image={transformedImage}
      />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  picture: {
    backgroundColor: colors.transparent,
  },
});

export default TransformedImageRenderer;
