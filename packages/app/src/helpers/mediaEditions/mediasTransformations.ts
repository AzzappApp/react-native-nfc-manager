import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import { EditionParametersSkiaEffects } from './EditionParameters';
import { applyLutFilter } from './LUTFilters';
import { createImageFromNativeBuffer } from './NativeBufferLoader';
import type {
  CropData,
  ImageOrientation,
  EditionParameters,
} from './EditionParameters';
import type { VideoFrame } from '@azzapp/react-native-skia-video';
import type { SkImage, SkMatrix, SkShader } from '@shopify/react-native-skia';

export type ImageFrame = {
  image: SkImage;
  width: number;
  height: number;
  matrix: SkMatrix;
};

export type ShaderFrame = {
  shader: SkShader;
  width: number;
  height: number;
};

export type ImageFrameTransformation = (frame: ImageFrame) => ImageFrame;

export type ShaderFrameTransformation = (
  shaderFrame: ShaderFrame,
) => ShaderFrame;

export const imageFrameFromImage = (image: SkImage): ImageFrame => {
  'worklet';
  return {
    image,
    width: image.width(),
    height: image.height(),
    matrix: Skia.Matrix(),
  };
};

export const imageFrameFromVideoFrame = (
  frame: VideoFrame,
): ImageFrame | null => {
  'worklet';
  const image = createImageFromNativeBuffer(frame?.buffer);
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

  return { image, matrix, width: imageWidth, height: imageHeight };
};

export const imageFrameTransformations = {
  orientation: (orientation: ImageOrientation | null | undefined) => {
    'worklet';
    return ({ image, width, height, matrix }: ImageFrame): ImageFrame => {
      'worklet';
      if (orientation && orientation !== 'UP') {
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
      }
      return { image, width, height, matrix };
    };
  },
  roll: (roll: number | null | undefined) => {
    'worklet';
    return ({ image, width, height, matrix }: ImageFrame): ImageFrame => {
      'worklet';
      if (roll) {
        matrix.postTranslate(-width / 2, -height / 2);
        matrix.postRotate(roll * (Math.PI / 180));
        matrix.postTranslate(width / 2, height / 2);
      }
      return { image, width, height, matrix };
    };
  },

  crop: (cropData: CropData | null | undefined) => {
    'worklet';
    return ({ image, width, height, matrix }: ImageFrame): ImageFrame => {
      'worklet';
      if (!cropData) {
        return { image, width, height, matrix };
      }
      matrix.postTranslate(-cropData.originX, -cropData.originY);
      return { image, width: cropData.width, height: cropData.height, matrix };
    };
  },
  scale: (targetWidth: number, targetHeight: number) => {
    'worklet';
    return ({ image, width, height, matrix }: ImageFrame): ImageFrame => {
      'worklet';
      matrix.postScale(targetWidth / width, targetHeight / height);
      return { image, width: targetWidth, height: targetHeight, matrix };
    };
  },
};

export const applyImageFrameTransformations = (
  frame: ImageFrame,
  transformations: ImageFrameTransformation[],
): ImageFrame => {
  'worklet';
  const matrix = Skia.Matrix();
  matrix.concat(frame.matrix);
  return transformations.reduce(
    (acc: ImageFrame, transformation) => transformation(acc),
    { ...frame, matrix },
  );
};

export const imageFrameToShaderFrame = ({
  image,
  matrix,
  width,
  height,
}: ImageFrame): ShaderFrame => {
  'worklet';
  return {
    shader: image.makeShaderOptions(
      TileMode.Decal,
      TileMode.Decal,
      FilterMode.Linear,
      MipmapMode.Linear,
      matrix,
    ),
    width,
    height,
  };
};

export const shaderFrameTransformations = {
  lut: (lutShader: SkShader | null | undefined) => {
    'worklet';
    return (shaderFrame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (!lutShader) {
        return shaderFrame;
      }
      return {
        ...shaderFrame,
        shader: applyLutFilter(shaderFrame.shader, lutShader),
      };
    };
  },
  brightness: (brightness: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (!brightness) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.brightness(
          brightness,
          frame.shader,
        ),
      };
    };
  },
  contrast: (contrast: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (contrast == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.contrast(contrast, frame.shader),
      };
    };
  },
  highlights: (highlights: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (highlights == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.highlights(
          highlights,
          frame.shader,
        ),
      };
    };
  },
  saturation: (saturation: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (saturation == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.saturation(
          saturation,
          frame.shader,
        ),
      };
    };
  },
  shadow: (shadow: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (shadow == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.shadow(shadow, frame.shader),
      };
    };
  },
  sharpness: (sharpness: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (sharpness == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.sharpness(
          sharpness < 0 ? sharpness / 2 : sharpness,
          frame.shader,
        ),
      };
    };
  },
  temperature: (temperature: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (temperature == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.temperature(
          6500 + (temperature > 0 ? 10000 * temperature : 2500 * temperature),
          frame.shader,
        ),
      };
    };
  },
  vibrance: (vibrance: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (vibrance == null) {
        return frame;
      }
      return {
        ...frame,
        shader: EditionParametersSkiaEffects.vibrance(vibrance, frame.shader),
      };
    };
  },
  vignetting: (vignetting: number | null | undefined) => {
    'worklet';
    return (frame: ShaderFrame): ShaderFrame => {
      'worklet';
      if (vignetting == null) {
        return frame;
      }
      const { shader, width, height } = frame;
      return {
        shader: EditionParametersSkiaEffects.vignetting(
          [vignetting, width, height],
          shader,
        ),
        width,
        height,
      };
    };
  },
};

export const getTransformsForEditionParameters = ({
  width,
  height,
  editionParameters,
  lutShader,
}: {
  width: number;
  height: number;
  editionParameters?: EditionParameters | null;
  lutShader?: SkShader | null;
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
    // tint,
    vibrance,
    vignetting,
  } = editionParameters ?? {};

  return {
    imageTransformations: [
      imageFrameTransformations.orientation(orientation),
      imageFrameTransformations.roll(roll),
      imageFrameTransformations.crop(cropData),
      imageFrameTransformations.scale(width, height),
    ],
    shaderTransformations: [
      shaderFrameTransformations.lut(lutShader),
      shaderFrameTransformations.brightness(brightness),
      shaderFrameTransformations.contrast(contrast),
      shaderFrameTransformations.highlights(highlights),
      shaderFrameTransformations.saturation(saturation),
      shaderFrameTransformations.shadow(shadow),
      shaderFrameTransformations.sharpness(sharpness),
      shaderFrameTransformations.temperature(temperature),
      shaderFrameTransformations.vibrance(vibrance),
      shaderFrameTransformations.vignetting(vignetting),
    ],
  };
};

export const applyShaderTransformations = (
  shaderFrame: ShaderFrame,
  transformations: ShaderFrameTransformation[],
): ShaderFrame => {
  'worklet';
  return transformations.reduce(
    (acc: ShaderFrame, transformation) => transformation(acc),
    shaderFrame,
  );
};

export const transformImage = ({
  imageFrame,
  width,
  height,
  editionParameters,
  lutShader,
}: {
  imageFrame: ImageFrame;
  width: number;
  height: number;
  editionParameters?: EditionParameters | null;
  lutShader?: SkShader | null;
}): SkShader => {
  'worklet';
  const { imageTransformations, shaderTransformations } =
    getTransformsForEditionParameters({
      width,
      height,
      editionParameters,
      lutShader,
    });
  const shaderFrame = applyShaderTransformations(
    imageFrameToShaderFrame(
      applyImageFrameTransformations(imageFrame, imageTransformations),
    ),
    shaderTransformations,
  );
  return shaderFrame.shader;
};
