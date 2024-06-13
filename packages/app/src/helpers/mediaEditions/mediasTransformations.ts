import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import {
  EditionParametersSkiaEffects,
  type EditionParameters,
} from './EditionParameters';
import { applyLutFilter } from './LUTFilters';
import { createImageFromNativeBuffer } from './NativeBufferLoader';
import type { MediaAnimation } from '#components/CoverEditor/coverDrawer/mediaAnimation';
import type { VideoFrame } from '@azzapp/react-native-skia-video';
import type {
  Matrix4,
  SkImage,
  SkMatrix,
  SkShader,
} from '@shopify/react-native-skia';

export const transformImage = ({
  image,
  localMatrix,
  imageWidth = image.width(),
  imageHeight = image.height(),
  width,
  height,
  editionParameters,
  lutShader,
  imageAnimation,
}: {
  image: SkImage;
  localMatrix?: Matrix4 | SkMatrix | null;
  imageWidth?: number;
  imageHeight?: number;
  width: number;
  height: number;
  editionParameters?: EditionParameters | null;
  lutShader?: SkShader | null;
  imageAnimation?: {
    animation: MediaAnimation;
    time: number;
    duration: number;
  };
}) => {
  'worklet';
  const {
    brightness,
    contrast,
    cropData: maybeCropData,
    highlights,
    orientation,
    roll,
    saturation,
    shadow,
    sharpness,
    temperature,
    // tint,
    vibrance,
    vignetting,
  } = editionParameters ?? {};

  const cropData = maybeCropData ?? {
    originX: 0,
    originY: 0,
    width: image.width(),
    height: image.height(),
  };

  const matrix = Skia.Matrix();
  if (localMatrix) {
    matrix.concat(localMatrix);
  }
  if (orientation && orientation !== 'UP') {
    matrix.postTranslate(-imageWidth / 2, -imageHeight / 2);
    matrix.postRotate(
      orientation === 'DOWN'
        ? Math.PI
        : orientation === 'LEFT'
          ? -Math.PI / 2
          : Math.PI / 2,
    );
    if (orientation === 'DOWN') {
      matrix.postTranslate(imageWidth / 2, imageHeight / 2);
    } else {
      matrix.postTranslate(imageHeight / 2, imageWidth / 2);
    }
  }
  if (roll) {
    matrix.postTranslate(-imageWidth / 2, -imageHeight / 2);
    matrix.postRotate(roll * (Math.PI / 180));
    matrix.postTranslate(imageWidth / 2, imageHeight / 2);
  }
  //do this before the croping or update the imageWidth and imageHeight
  if (imageAnimation) {
    const { animation, time, duration } = imageAnimation;
    animation.animate({
      matrix,
      time,
      duration,
      width: imageWidth,
      height: imageHeight,
    });
  }
  matrix.postTranslate(-cropData.originX, -cropData.originY);
  matrix.postScale(width / cropData.width, height / cropData.height);

  let shader: SkShader = image.makeShaderOptions(
    TileMode.Decal,
    TileMode.Decal,
    FilterMode.Linear,
    MipmapMode.Linear,
    matrix,
  );

  if (lutShader) {
    shader = applyLutFilter(shader, lutShader);
  }
  if (brightness) {
    shader = EditionParametersSkiaEffects.brightness(brightness, shader);
  }
  if (contrast != null) {
    shader = EditionParametersSkiaEffects.contrast(contrast, shader);
  }
  if (highlights != null) {
    shader = EditionParametersSkiaEffects.highlights(highlights, shader);
  }
  if (saturation != null) {
    shader = EditionParametersSkiaEffects.saturation(saturation, shader);
  }
  if (shadow != null) {
    shader = EditionParametersSkiaEffects.shadow(shadow, shader);
  }
  if (sharpness != null) {
    shader = EditionParametersSkiaEffects.sharpness(
      sharpness < 0 ? sharpness / 2 : sharpness,
      shader,
    );
  }
  if (temperature != null) {
    shader = EditionParametersSkiaEffects.temperature(
      6500 + (temperature > 0 ? 10000 * temperature : 2500 * temperature),
      shader,
    );
  }
  if (vibrance) {
    shader = EditionParametersSkiaEffects.vibrance(vibrance, shader);
  }
  if (vignetting) {
    shader = EditionParametersSkiaEffects.vignetting(
      [vignetting, width, height],
      shader,
    );
  }

  return shader;
};

export const transformVideoFrame = ({
  frame,
  width,
  height,
  editionParameters,
  lutShader,
}: {
  frame: VideoFrame;
  localMatrix?: SkMatrix | null;
  imageWidth?: number;
  imageHeight?: number;
  width: number;
  height: number;
  editionParameters?: EditionParameters | null;
  lutShader?: SkShader | null;
}) => {
  'worklet';
  const image = createImageFromNativeBuffer(frame?.buffer, false);
  if (!image) {
    return;
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
  return transformImage({
    image,
    width,
    height,
    imageWidth,
    imageHeight,
    localMatrix: matrix,
    editionParameters,
    lutShader,
  });
};
