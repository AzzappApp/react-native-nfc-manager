import {
  ImageFormat,
  Skia,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system/next';
import { Platform } from 'react-native';
import { getVideoMetaData } from 'react-native-compressor';
import {
  exportVideoComposition,
  getValidEncoderConfigurations,
} from '@azzapp/react-native-skia-video';
import { COVER_MAX_HEIGHT, COVER_MAX_WIDTH } from '@azzapp/shared/coverHelpers';
import { MEMORY_SIZE } from '#helpers/device';
import {
  createRandomFileName,
  createRandomFilePath,
} from '#helpers/fileHelpers';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import { getLutURI } from './LUTFilters';
import {
  getDeviceMaxDecodingResolution,
  reduceVideoResolutionIfNecessary,
  scaleCropData,
} from './mediaEditionHelpers';
import { transformImage } from './mediasTransformations';
import NativeTextureLoader, {
  createImageFromNativeTexture,
} from './NativeTextureLoader';
import {
  createSingleVideoComposition,
  createSingleVideoFrameDrawer,
} from './singleVideoCompositions';
import type { EditionParameters } from './EditionParameters';
import type { TextureInfo } from './NativeTextureLoader';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkColor } from '@shopify/react-native-skia';

export const createVideoThumbnail = async ({
  uri,
  format,
  quality,
  previewPositionPercentage,
}: {
  uri: string;
  format: ImageFormat;
  quality: number;
  previewPositionPercentage?: number | null;
  backgroundColor?: SkColor;
}) => {
  const metadata = await getVideoMetaData(uri);

  const { key, promise } = NativeTextureLoader.loadVideoThumbnail(
    uri,
    previewPositionPercentage
      ? (metadata.duration * previewPositionPercentage) / 100
      : 0,
    {
      width: COVER_MAX_HEIGHT,
      height: COVER_MAX_WIDTH,
    },
  );
  NativeTextureLoader.ref(key);
  const sourceImage = createImageFromNativeTexture(await promise);
  if (!sourceImage) {
    NativeTextureLoader.unref(key);
    throw new Error('Image not found');
  }

  const blob = await sourceImage.encodeToBytes(format, quality);
  const ext =
    format === ImageFormat.JPEG ? 'jpg' : ImageFormat.PNG ? 'png' : 'webp';

  const path = Paths.cache.uri + createRandomFileName(ext);
  const file = new File(path);
  file.create();
  file.write(blob);

  NativeTextureLoader.unref(uri);

  return path;
};

export const saveTransformedImageToFile = async ({
  uri,
  resolution,
  format,
  quality,
  filter,
  editionParameters,
  backgroundColor,
}: {
  uri: string;
  resolution: { width: number; height: number };
  format: ImageFormat;
  quality: number;
  filter?: Filter | null;
  editionParameters?: EditionParameters | null;
  backgroundColor?: SkColor;
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
  const { lutTexture, lutKey } = await getLutTexture(filter ?? null);
  try {
    const transformedImage = drawAsImageFromPicture(
      createPicture(canvas => {
        const imageFilter = transformImage({
          image: sourceImage,
          imageInfo: {
            matrix: Skia.Matrix(),
            width: sourceImage.width(),
            height: sourceImage.height(),
          },
          targetHeight: resolution.height,
          targetWidth: resolution.width,
          editionParameters,
          lutTexture,
        });
        const paint = Skia.Paint();
        paint.setImageFilter(imageFilter);
        if (backgroundColor) {
          canvas.clear(backgroundColor);
        }
        canvas.drawRect(
          {
            x: 0,
            y: 0,
            width: resolution.width,
            height: resolution.height,
          },
          paint,
        );
      }),
      resolution,
    );

    const blob = await transformedImage.encodeToBytes(format, quality);
    const ext =
      format === ImageFormat.JPEG ? 'jpg' : ImageFormat.PNG ? 'png' : 'webp';

    const path = Paths.cache.uri + createRandomFileName(ext);
    const file = new File(path);
    file.create();
    file.write(blob);

    NativeTextureLoader.unref(uri);

    return path;
  } finally {
    if (lutKey) {
      NativeTextureLoader.unref(lutKey);
    }
  }
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
  maxDecoderResolution = MAX_EXPORT_DECODER_RESOLUTION,
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
  maxDecoderResolution?: number;
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
      getDeviceMaxDecodingResolution(sourcePath, maxDecoderResolution),
    );

  const cropData = editionParameters?.cropData;
  editionParameters = {
    ...editionParameters,
    cropData: cropData ? scaleCropData(cropData, videoScale) : undefined,
  };

  const videoComposition = createSingleVideoComposition(
    sourcePath.replace('file://', ''),
    startTime ?? 0,
    duration ?? 0,
    decoderResolution,
  );

  const { lutTexture, lutKey } = await getLutTexture(filter ?? null);

  const drawFrame = createSingleVideoFrameDrawer(
    editionParameters ?? null,
    lutTexture,
  );

  const outPath = createRandomFilePath('mp4');

  const requestedConfigs = {
    ...resolution,
    bitRate,
    frameRate,
  };

  try {
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

    await exportVideoComposition({
      videoComposition,
      drawFrame,
      outPath: outPath.replace('file://', ''),
      afterDrawFrame() {
        'worklet';
        global.gc?.();
      },
      ...encoderConfigs,
    });
    return outPath;
  } finally {
    if (lutKey) {
      NativeTextureLoader.unref(lutKey);
    }
  }
};

export const getTargetFormatFromPath = (path: string) => {
  return path.toLowerCase().endsWith('.png')
    ? ImageFormat.PNG
    : ImageFormat.JPEG;
};

const getLutTexture = async (filter: Filter | null) => {
  let lutTexture: TextureInfo | null = null;
  let lutKey: string | null = null;
  if (filter) {
    const lutUri = getLutURI(filter);
    if (lutUri) {
      const { promise, key } = NativeTextureLoader.loadImage(lutUri);
      lutTexture = await promise;
      lutKey = key;
      NativeTextureLoader.ref(key);
    }
  }
  return { lutTexture, lutKey };
};
