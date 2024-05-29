import {
  ImageFormat,
  Skia,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { exportVideoComposition } from '@azzapp/react-native-skia-video';
import { createId } from '#helpers/idHelpers';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import { getLutShader } from './LUTFilters';
import {
  reduceVideoResolutionIfNecessary,
  scaleCropData,
} from './mediaEdtionHelpers';
import { transformImage } from './mediasTransformations';
import {
  createSingleVideoComposition,
  createSingleVideoFrameDrawer,
} from './singleVideoCompositions';
import SKImageLoader from './SKImageLoader';
import type { EditionParameters } from './EditionParameters';
import type { Filter } from './LUTFilters';

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
  const sourceImage = await SKImageLoader.loadImage(uri);
  SKImageLoader.refImage(uri);
  const lutShader = filter ? await getLutShader(filter) : null;
  const transformedImage = drawAsImageFromPicture(
    createPicture(canvas => {
      const paint = Skia.Paint();
      paint.setShader(
        transformImage({
          image: sourceImage,
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

  return path;
};

// TODO differentiate by OS and models ? the resolution has great impact on the memory usage
const MAX_EXPORT_DECODER_RESOLUTION = 1920;

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
      MAX_EXPORT_DECODER_RESOLUTION,
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

  await exportVideoComposition(
    videoComposition,
    {
      outPath,
      ...resolution,
      bitRate,
      frameRate,
    },
    drawFrame,
  );
  return outPath;
};

const createRandomFilePath = (ext: string) =>
  `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${createId()}.${ext}`;
