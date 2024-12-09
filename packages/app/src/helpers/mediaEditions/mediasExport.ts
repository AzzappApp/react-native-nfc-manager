import {
  ImageFormat,
  Skia,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  exportVideoComposition,
  getValidEncoderConfigurations,
} from '@azzapp/react-native-skia-video';
import { createRandomFilePath } from '#helpers/fileHelpers';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import { getLutShader } from './LUTFilters';
import {
  getDeviceMaxDecodingResolution,
  reduceVideoResolutionIfNecessary,
  scaleCropData,
} from './mediaEditionHelpers';
import { imageFrameFromImage, transformImage } from './mediasTransformations';
import NativeTextureLoader, {
  createImageFromNativeTexture,
} from './NativeTextureLoader';
import {
  createSingleVideoComposition,
  createSingleVideoFrameDrawer,
} from './singleVideoCompositions';
import type { EditionParameters } from './EditionParameters';
import type { Filter } from '@azzapp/shared/filtersHelper';
const MEMORY_SIZE = (Device.totalMemory ?? 0) / Math.pow(1024, 3);

export const saveTransformedImageToFile = async ({
  uri,
  resolution,
  format,
  quality,
  filter,
  editionParameters,
}: {
  uri: string;
  resolution: { width: number; height: number };
  format: ImageFormat;
  quality: number;
  filter?: Filter | null;
  editionParameters?: EditionParameters | null;
}) => {
  const { key, promise } = NativeTextureLoader.loadImage(uri);
  const sourceImage = createImageFromNativeTexture(await promise);
  if (!sourceImage) {
    throw new Error('Image not found');
  }
  NativeTextureLoader.ref(key);
  if (!sourceImage) {
    NativeTextureLoader.unref(key);
    throw new Error('Image not found');
  }
  const lutShader = filter ? await getLutShader(filter) : null;
  const transformedImage = drawAsImageFromPicture(
    createPicture(canvas => {
      const paint = Skia.Paint();
      paint.setShader(
        transformImage({
          imageFrame: imageFrameFromImage(sourceImage),
          ...resolution,
          editionParameters,
          lutShader,
        }),
      );
      canvas.drawPaint(paint);
    }),
    resolution,
  );
  // TODO: we need to use encodeToBytes here but react-native-blod-util
  // does not support Uint8Array
  // const bytes = await image.encodeToBytes(format, quality);
  const blob = await transformedImage.encodeToBase64(format, quality);
  const ext =
    format === ImageFormat.JPEG ? 'jpg' : ImageFormat.PNG ? 'png' : 'webp';

  const path = createRandomFilePath(ext);
  await ReactNativeBlobUtil.fs.writeFile(path, blob, 'base64');

  NativeTextureLoader.unref(uri);

  return path;
};

const MAX_EXPORT_DECODER_RESOLUTION = MEMORY_SIZE < 8 ? 1280 : 1920;

export const saveTransformedVideoToFile = async ({
  video,
  resolution,
  frameRate,
  bitRate,
  filter,
  editionParameters,
  // TODO sound is not supported yet
  removeSound: _removeSound = false,
  startTime,
  duration,
}: {
  video: {
    uri: string;
    width: number;
    height: number;
    rotation: number;
  };
  resolution: { width: number; height: number };
  frameRate: number;
  bitRate: number;
  filter?: Filter | null;
  editionParameters?: EditionParameters | null;
  removeSound?: boolean;
  startTime?: number;
  duration?: number;
}): Promise<string> => {
  const sourcePath = await getVideoLocalPath(video.uri);
  if (!sourcePath) {
    throw new Error('Video not found');
  }

  const { resolution: decoderResolution, videoScale } =
    reduceVideoResolutionIfNecessary(
      video.width,
      video.height,
      video.rotation,
      getDeviceMaxDecodingResolution(sourcePath, MAX_EXPORT_DECODER_RESOLUTION),
    );

  const cropData = editionParameters?.cropData;
  editionParameters = {
    ...editionParameters,
    cropData: cropData ? scaleCropData(cropData, videoScale) : undefined,
  };

  const videoComposition = createSingleVideoComposition(
    sourcePath,
    startTime ?? 0,
    duration ?? 0,
    decoderResolution,
  );

  const drawFrame = createSingleVideoFrameDrawer(
    editionParameters ?? null,
    filter ? await getLutShader(filter) : null,
  );

  const outPath = createRandomFilePath('.mp4');

  const requestedConfigs = {
    ...resolution,
    bitRate,
    frameRate,
  };

  const validConfigs =
    Platform.OS === 'android'
      ? getValidEncoderConfigurations(
          requestedConfigs.width,
          requestedConfigs.height,
          requestedConfigs.frameRate,
          requestedConfigs.bitRate,
        )
      : [requestedConfigs];
  if (!validConfigs || validConfigs.length === 0) {
    throw new Error('No valid encoder configuration found');
  }

  const encoderConfigs = validConfigs[0]!;

  await exportVideoComposition(
    videoComposition,
    {
      outPath,
      ...encoderConfigs,
    },
    drawFrame,
  );
  return outPath;
};

export const getTargetFormatFromPath = (path: string) => {
  return path.toLowerCase().endsWith('.png')
    ? ImageFormat.PNG
    : ImageFormat.JPEG;
};
