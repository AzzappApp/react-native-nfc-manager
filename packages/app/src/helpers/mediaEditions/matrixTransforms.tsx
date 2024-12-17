import { Skia } from '@shopify/react-native-skia';
import type { CropData, ImageOrientation } from './EditionParameters';
import type { ImageInfo } from './mediasTransformations';

const applyOrientation = (
  orientation: ImageOrientation | null | undefined,
  imageInfo: ImageInfo,
): ImageInfo => {
  'worklet';
  if (orientation && orientation !== 'UP') {
    let { width, height, matrix } = imageInfo;
    matrix = Skia.Matrix().concat(matrix);
    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postRotate(
      orientation === 'DOWN'
        ? Math.PI
        : orientation === 'LEFT'
          ? -Math.PI / 2
          : Math.PI / 2,
    );
    if (orientation === 'DOWN') {
      matrix.postTranslate(width / 2, height / 2);
    } else {
      matrix.postTranslate(height / 2, width / 2);
      const temp = width;
      width = height;
      height = temp;
    }
    return { width, height, matrix };
  }
  return imageInfo;
};

const applyRoll = (
  roll: number | null | undefined,
  imageInfo: ImageInfo,
): ImageInfo => {
  'worklet';
  if (roll) {
    const { width, height } = imageInfo;
    const matrix = Skia.Matrix().concat(imageInfo.matrix);
    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postRotate(roll * (Math.PI / 180));
    matrix.postTranslate(width / 2, height / 2);
    return { width, height, matrix };
  }
  return imageInfo;
};

const applyCrop = (
  cropData: CropData | null | undefined,
  imageInfo: ImageInfo,
): ImageInfo => {
  'worklet';
  if (!cropData) {
    return imageInfo;
  }
  const matrix = Skia.Matrix().concat(imageInfo.matrix);
  matrix.postTranslate(-cropData.originX, -cropData.originY);
  return { width: cropData.width, height: cropData.height, matrix };
};

const applyScale = (
  targetWidth: number,
  targetHeight: number,
  { width, height, matrix }: ImageInfo,
): ImageInfo => {
  'worklet';
  matrix = Skia.Matrix().concat(matrix);
  matrix.postScale(targetWidth / width, targetHeight / height);
  return { width: targetWidth, height: targetHeight, matrix };
};

export default {
  roll: applyRoll,
  crop: applyCrop,
  orientation: applyOrientation,
  scale: applyScale,
};
