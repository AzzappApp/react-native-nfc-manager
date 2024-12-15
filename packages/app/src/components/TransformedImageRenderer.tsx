import { Canvas, Image, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { PixelRatio } from 'react-native';
import {
  runOnUI,
  useDerivedValue,
  useSharedValue,
  type DerivedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  transformImage,
  useLutTexture,
  type EditionParameters,
} from '#helpers/mediaEditions';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkImage, SkSurface } from '@shopify/react-native-skia';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export type TransformedImageRendererProps = Exclude<ViewProps, 'children'> & {
  image: DerivedValue<SkImage | null>;
  editionParameters?: EditionParameters | null;
  filter?: Filter | null;
  width: number;
  height: number;
  imageStyle?: StyleProp<ViewStyle>;
};

const TransformedImageRenderer = ({
  image,
  editionParameters,
  filter,
  width,
  height,
  ...props
}: TransformedImageRendererProps) => {
  const lutTexture = useLutTexture(filter);

  const pixelRatio = PixelRatio.get();
  const surfaceShared = useSharedValue<SkSurface | null>(null);
  useEffect(() => {
    runOnUI(() => {
      surfaceShared.value?.dispose();
      surfaceShared.value = Skia.Surface.MakeOffscreen(
        width * pixelRatio,
        height * pixelRatio,
      );
      if (!surfaceShared.value) {
        console.error('Failed to create surface');
      }
    })();
  }, [height, pixelRatio, surfaceShared, width]);

  const transformedImage = useDerivedValue(() => {
    if (!image.value) {
      return null;
    }
    const surface = surfaceShared.value;
    if (!surface) {
      return null;
    }
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('#00000000'));
    const imageFilter = transformImage({
      image: image.value,
      imageInfo: {
        width: image.value.width(),
        height: image.value.height(),
        matrix: Skia.Matrix(),
      },
      targetWidth: width * pixelRatio,
      targetHeight: height * pixelRatio,
      editionParameters,
      lutTexture,
    });
    const paint = Skia.Paint();
    paint.setImageFilter(imageFilter);
    canvas.drawRect(
      {
        x: 0,
        y: 0,
        width: surface.width(),
        height: surface.height(),
      },
      paint,
    );
    surface.flush();
    const transformedImage = surface.makeImageSnapshot();
    return transformedImage;
  });

  const styles = useStyleSheet(styleSheet);

  return (
    <Canvas style={[styles.picture, { width, height }, props.style]} {...props}>
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

const styleSheet = createStyleSheet(appearance => ({
  picture: {
    //this will hack a bug on SKiaPictureView not accepting transparent background
    backgroundColor: appearance === 'light' ? colors.grey500 : colors.black,
  },
}));

export default TransformedImageRenderer;
