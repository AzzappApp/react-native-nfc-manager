import { Skia } from '@shopify/react-native-skia';
import imageFilterTransforms from './imageFilterTransforms';
import matrixTransforms from './matrixTransforms';
import { createImageFromNativeTexture } from './NativeTextureLoader';
import type { EditionParameters } from './EditionParameters';
import type { TextureInfo } from './NativeTextureLoader';
import type { VideoFrame } from '@azzapp/react-native-skia-video';
import type { SkImage, SkMatrix } from '@shopify/react-native-skia';

export type ImageInfo = {
  width: number;
  height: number;
  matrix: SkMatrix;
};

export const createImageFromVideoFrame = (
  frame: VideoFrame,
): { image: SkImage; imageInfo: ImageInfo } | null => {
  'worklet';
  const image = createImageFromNativeTexture(frame);
  if (image == null) {
    return null;
  }
  const isOrientationPortrait =
    frame.rotation === 90 || frame.rotation === -90 || frame.rotation === 270;
  const matrix = Skia.Matrix();
  if (frame.rotation !== 0) {
    matrix.postTranslate(-frame.width / 2, -frame.height / 2);
    matrix.postRotate(frame.rotation * (Math.PI / 180));
    if (isOrientationPortrait) {
      matrix.postTranslate(frame.height / 2, frame.width / 2);
    } else {
      matrix.postTranslate(frame.width / 2, frame.height / 2);
    }
  }
  const imageWidth = isOrientationPortrait ? frame.height : frame.width;
  const imageHeight = isOrientationPortrait ? frame.width : frame.height;

  return {
    image,
    imageInfo: { matrix, width: imageWidth, height: imageHeight },
  };
};

export const transformImageInfo = ({
  imageInfo,
  editionParameters,
  targetWidth,
  targetHeight,
}: {
  imageInfo: ImageInfo;
  targetWidth: number;
  targetHeight: number;
  editionParameters?: EditionParameters | null;
}): ImageInfo => {
  'worklet';
  const { cropData, orientation, roll } = editionParameters ?? {};

  imageInfo = matrixTransforms.orientation(orientation, imageInfo);
  imageInfo = matrixTransforms.roll(roll, imageInfo);
  imageInfo = matrixTransforms.crop(cropData, imageInfo);
  imageInfo = matrixTransforms.scale(targetWidth, targetHeight, imageInfo);
  return imageInfo;
};

export const transformImage = ({
  image,
  imageInfo,
  targetWidth,
  targetHeight,
  editionParameters,
  lutTexture,
}: {
  image: SkImage;
  imageInfo: ImageInfo;
  targetWidth: number;
  targetHeight: number;
  editionParameters?: EditionParameters | null;
  lutTexture?: TextureInfo | null;
}) => {
  'worklet';
  const {
    cropData,
    orientation,
    roll,
    brightness,
    contrast,
    highlights,
    saturation,
    shadow,
    sharpness,
    temperature,
    vibrance,
    vignetting,
  } = editionParameters ?? {};

  imageInfo = transformImageInfo({
    imageInfo,
    editionParameters: {
      cropData,
      orientation,
      roll,
    },
    targetWidth,
    targetHeight,
  });
  let imageFilter = Skia.ImageFilter.MakeMatrixTransform(
    imageInfo.matrix,
    Skia.ImageFilter.MakeImage(image),
  );

  if (lutTexture) {
    imageFilter =
      imageFilterTransforms.lut(lutTexture, imageFilter) ?? imageFilter;
  }
  if (brightness) {
    imageFilter =
      imageFilterTransforms.brightness({ brightness }, imageFilter) ??
      imageFilter;
  }
  if (contrast != null) {
    imageFilter =
      imageFilterTransforms.contrast({ contrast }, imageFilter) ?? imageFilter;
  }
  if (highlights != null) {
    imageFilter =
      imageFilterTransforms.highlights({ highlights }, imageFilter) ??
      imageFilter;
  }
  if (saturation != null) {
    imageFilter =
      imageFilterTransforms.saturation({ saturation }, imageFilter) ??
      imageFilter;
  }
  if (shadow != null) {
    imageFilter =
      imageFilterTransforms.shadow({ shadow }, imageFilter) ?? imageFilter;
  }
  if (sharpness != null) {
    imageFilter =
      imageFilterTransforms.sharpness(
        { sharpness: sharpness < 0 ? sharpness / 2 : sharpness },
        imageFilter,
      ) ?? imageFilter;
  }
  if (temperature != null) {
    imageFilter =
      imageFilterTransforms.temperature(
        {
          temperature:
            6500 + (temperature > 0 ? 10000 * temperature : 2500 * temperature),
        },
        imageFilter,
      ) ?? imageFilter;
  }
  if (vibrance != null) {
    imageFilter =
      imageFilterTransforms.vibrance({ vibrance }, imageFilter) ?? imageFilter;
  }
  if (vignetting != null) {
    imageFilter =
      imageFilterTransforms.vignetting(
        { vignetting, iResolution: [targetWidth, targetHeight] },
        imageFilter,
      ) ?? imageFilter;
  }

  return imageFilter;
};
