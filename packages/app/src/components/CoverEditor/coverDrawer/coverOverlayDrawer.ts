import { Skia } from '@shopify/react-native-skia';
import { cropDataForAspectRatio, transformImage } from '#helpers/mediaEditions';
import { percentRectToRect } from '../coverEditorHelpers';
import type { CoverDrawerOptions } from './types';

const coverOverlayDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { overlayLayer },
  images,
  lutShaders,
}: CoverDrawerOptions) => {
  'worklet';
  if (!overlayLayer) {
    return;
  }
  const { media, filter, bounds, editionParameters, rotation } = overlayLayer;
  const image = images[media.uri];
  const {
    x,
    y,
    width: imageWidth,
    height: imageHeight,
  } = percentRectToRect(bounds, width, height);
  if (!image) {
    return;
  }
  let cropData = editionParameters?.cropData;
  if (
    !cropData ||
    Math.abs(cropData.width / cropData.height - imageWidth / imageHeight) > 0.01
  ) {
    cropData = cropDataForAspectRatio(
      media.width,
      media.height,
      imageWidth / imageHeight,
    );
  }
  const shader = transformImage({
    image,
    lutShader: filter ? lutShaders[filter] : null,
    width: imageWidth,
    height: imageHeight,
    editionParameters: {
      ...editionParameters,
      cropData,
    },
  });
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.save();
  canvas.translate(x, y);
  if (rotation) {
    canvas.rotate((rotation * 180) / Math.PI, imageWidth / 2, imageHeight / 2);
  }
  canvas.drawRect(
    {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
    },
    paint,
  );
  canvas.restore();
};

export default coverOverlayDrawer;
