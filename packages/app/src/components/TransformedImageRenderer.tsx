import { createPicture, Skia } from '@shopify/react-native-skia';
import { PixelRatio } from 'react-native';
import { useDerivedValue, type DerivedValue } from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  imageFrameFromImage,
  transformImage,
  useLutShader,
  type EditionParameters,
} from '#helpers/mediaEditions';
import SkiaAnimatedPictureView from '#ui/SkiaAnimatedPictureView';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkImage } from '@shopify/react-native-skia';
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
  const lutShader = useLutShader(filter);

  const pixelRatio = PixelRatio.get();
  const picture = useDerivedValue(
    () =>
      createPicture(canvas => {
        if (!image.value) {
          return;
        }
        const paint = Skia.Paint();
        paint.setShader(
          transformImage({
            imageFrame: imageFrameFromImage(image.value),
            width: width * pixelRatio,
            height: height * pixelRatio,
            editionParameters,
            lutShader,
          }),
        );
        canvas.drawPaint(paint);
      }),
    [image, editionParameters, width, height, lutShader],
  );

  const styles = useStyleSheet(styleSheet);

  return (
    <SkiaAnimatedPictureView
      picture={picture}
      width={width}
      height={height}
      style={[styles.picture, props.style]}
      {...props}
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  picture: {
    //this will hack a bug on SKiaPictureView not accepting transparent background
    backgroundColor: appearance === 'light' ? colors.grey500 : colors.black,
  },
}));

export default TransformedImageRenderer;
