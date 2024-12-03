import ReactNativeBlobUtil from 'react-native-blob-util';
import ImageSize from 'react-native-image-size';
import { getFileExtension } from '#helpers/fileHelpers';
import type { SourceMedia } from './mediaTypes';
import type {
  FetchBlobResponse,
  StatefulPromise,
} from 'react-native-blob-util';

/**
 * Returns the size of an image.
 * @param uri The URI of the image.
 * @returns A promise that resolves with the size of the image.
 */
export const getImageSize = async (uri: string) => {
  const { rotation, width, height } = await ImageSize.getSize(uri);
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
};

/**
 * Format a number to a 2 digit string.
 */
export const display2digit = (n: number) => (n >= 10 ? `${n}` : `0${n}`);

/**
 * format a time in seconds to a string in the form of hh:mm:ss or mm:ss if the time is less than an hour.
 * @param timeInSeconds The time in seconds to format.
 * @returns A string in the form of hh:mm:ss or mm:ss if the time is less than an hour.
 */
export const formatVideoTime = (timeInSeconds = 0) => {
  let seconds = Math.floor(timeInSeconds);
  let minutes = Math.floor(timeInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  seconds = seconds % 60;
  if (hours) {
    return `${display2digit(hours)}:${display2digit(minutes)}:${display2digit(
      seconds,
    )}`;
  }
  return `${display2digit(minutes)}:${display2digit(seconds)}`;
};

/**
 * It takes a width and height, and returns a new width and height that are scaled down to fit within a
 * maximum dimension
 * @param {number} width - The width of the image
 * @param {number} height - The height of the image
 * @param {number} maxDimension - The maximum width or height of the image.
 * @returns An object with two properties, width and height.
 */
export const downScaleImage = (
  width: number,
  height: number,
  maxDimension: number,
) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = maxDimension / Math.max(width, height);
  return {
    width: width * ratio,
    height: height * ratio,
  };
};

export const isPNG = (uri: string) => uri.toLowerCase().endsWith('.png');

export const downloadRemoteFileToLocalCache = (
  uri: string,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  let canceled = false;
  let promise: StatefulPromise<FetchBlobResponse> | null = null;

  abortSignal?.addEventListener(
    'abort',
    () => {
      canceled = true;
      promise?.cancel();
    },
    { once: true },
  );

  const innerFetch = async () => {
    const ext = getFileExtension(uri);
    promise = ReactNativeBlobUtil.config({
      fileCache: true,
      appendExt: ext ?? undefined,
    }).fetch('GET', uri);

    return promise.then(
      response => {
        if (canceled) {
          return null;
        }
        return response.path();
      },
      error => {
        if (canceled) {
          return null;
        }
        throw error;
      },
    );
  };

  return innerFetch();
};

export const COVER_CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/covers`;
export const MODULES_CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/modules`;

let checkMediaCacheDirPromise: Promise<void> | null = null;
const checkMediaCacheDir = (cacheDir: string) => {
  if (!checkMediaCacheDirPromise) {
    checkMediaCacheDirPromise = (async () => {
      if (!(await ReactNativeBlobUtil.fs.isDir(cacheDir))) {
        await ReactNativeBlobUtil.fs.mkdir(cacheDir);
      }
    })();
  }
  return checkMediaCacheDirPromise;
};

const copyPromises: Record<string, Promise<string | null>> = {};

const copyCoverMediaToCacheDirInternal = async (
  media: SourceMedia,
  cacheDir: string,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  await checkMediaCacheDir(cacheDir);
  const ext = getFileExtension(media.uri);
  const sanitizedId = media.id.replace(/[^a-z0-9]/gi, '_');
  const resultPath = `${cacheDir}/${sanitizedId}${ext ? `.${ext}` : ''}`;
  if (await ReactNativeBlobUtil.fs.exists(resultPath)) {
    return resultPath;
  }
  let oldPath;
  if (media.uri && media.uri.startsWith('file:///android_asset')) {
    oldPath = ReactNativeBlobUtil.fs.asset(
      media.uri.replace('file:///android_asset/', ''),
    );
  } else if (media.uri && media.uri.startsWith('file://')) {
    oldPath = media.uri.replace('file://', '');
    if (!(await ReactNativeBlobUtil.fs.exists(oldPath))) {
      return null;
    }
  } else {
    oldPath = await downloadRemoteFileToLocalCache(media.uri, abortSignal);
    if (!oldPath) {
      return null;
    }
  }
  await ReactNativeBlobUtil.fs.cp(oldPath, resultPath);
  return resultPath;
};

export const copyCoverMediaToCacheDir = (
  media: SourceMedia,
  cacheDir: string = COVER_CACHE_DIR,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  if (!copyPromises[media.id]) {
    copyPromises[media.id] = copyCoverMediaToCacheDirInternal(
      media,
      cacheDir,
      abortSignal,
    );
    copyPromises[media.id].finally(() => {
      delete copyPromises[media.id];
    });
  }
  return copyPromises[media.id];
};
