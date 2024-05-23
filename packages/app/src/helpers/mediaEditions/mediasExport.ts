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

export const saveTransformedVideoToFile = async ({
  uri,
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
  uri: string;
  resolution: { width: number; height: number };
  frameRate: number;
  bitRate: number;
  filter?: Filter | null;
  editionParameters?: EditionParameters | null;
  removeSound?: boolean;
  startTime?: number;
  duration?: number;
}): Promise<string> => {
  const sourcePath = await getVideoLocalPath(uri);
  if (!sourcePath) {
    throw new Error('Video not found');
  }
  const videoComposition = createSingleVideoComposition(
    sourcePath,
    startTime ?? 0,
    duration ?? 0,
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
