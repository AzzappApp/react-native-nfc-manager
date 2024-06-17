import {
  Canvas,
  createPicture,
  Picture,
  Skia,
} from '@shopify/react-native-skia';
import { useDerivedValue, type DerivedValue } from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  useLutShader,
  type EditionParameters,
  transformImage,
} from '#helpers/mediaEditions';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkImage } from '@shopify/react-native-skia';
import type { ViewProps } from 'react-native';

export type TransformedImageRendererProps = Exclude<ViewProps, 'children'> & {
  image: DerivedValue<SkImage | null>;
  editionParameters?: EditionParameters | null;
  filter?: Filter | null;
  width: number;
  height: number;
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

  const picture = useDerivedValue(
    () =>
      createPicture(canvas => {
        if (!image.value) {
          return;
        }
        const paint = Skia.Paint();
        paint.setShader(
          transformImage({
            image: image.value,
            width,
            height,
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
    <Canvas style={[{ width, height }, styles.picture, props.style]} {...props}>
      <Picture picture={picture} />
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
