import {
  createPicture,
  Skia,
  SkiaPictureView,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import {
  useLutShader,
  type Filter,
  type EditionParameters,
  transformImage,
} from '#helpers/mediaEditions';
import type { SkImage } from '@shopify/react-native-skia';
import type { ViewProps } from 'react-native';

export type TransformedImageRendererProps = Exclude<ViewProps, 'children'> & {
  image: SkImage | null;
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

  const picture = useMemo(
    () =>
      createPicture(canvas => {
        if (!image) {
          return;
        }
        const paint = Skia.Paint();
        paint.setShader(
          transformImage({
            image,
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

  return (
    <SkiaPictureView
      picture={picture}
      {...props}
      style={[{ width, height }, props.style]}
    />
  );
};

export default TransformedImageRenderer;
