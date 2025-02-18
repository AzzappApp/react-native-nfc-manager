import * as Sentry from '@sentry/react-native';
import { Paths, Directory, File } from 'expo-file-system/next';
import ImageSize from 'react-native-image-size';
import { getFileExtension, isFileURL } from '#helpers/fileHelpers';
import type { SourceMedia } from './mediaTypes';

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

export const isPNG = (uri: string) => uri.toLowerCase().endsWith('.png');

export const FILE_CACHE_DIR = `${Paths.cache.uri}/files`;

export const downloadRemoteFileToLocalCache = (
  uri: string,
  abortSignal?: AbortSignal,
  targetFile?: File,
) => {
  let canceled = false;

  abortSignal?.addEventListener(
    'abort',
    () => {
      canceled = true;
    },
    { once: true },
  );

  const innerFetch = async () => {
    try {
      if (targetFile) {
        const file = await File.downloadFileAsync(uri, targetFile);
        if (canceled) {
          return null;
        }
        return new File(file.uri);
      } else {
        const targetDirectory = new Directory(FILE_CACHE_DIR);
        if (!targetDirectory.exists) {
          targetDirectory.create();
        }
        const file = await File.downloadFileAsync(uri, targetDirectory);
        if (canceled) {
          return null;
        }
        return new File(file.uri);
      }
    } catch (err) {
      if (canceled) {
        return null;
      }
      throw err;
    }
  };

  return innerFetch();
};

export const COVER_CACHE_DIR = `${Paths.cache.uri}covers`;
export const MODULES_CACHE_DIR = `${Paths.cache.uri}modules`;

const checkMediaCacheDir = (cacheDir: string) => {
  const directory = new Directory(cacheDir);
  if (!directory.exists) {
    directory.create();
  }
};

const copyPromises: Record<string, Promise<string | null>> = {};

const copyCoverMediaToCacheDirInternal = async (
  media: SourceMedia,
  cacheDir: string,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  checkMediaCacheDir(cacheDir);
  let ext = getFileExtension(media.uri);

  if (!ext && media.kind === 'video') {
    ext = 'mp4';
  }
  const sanitizedId = media.id.replace(/[^a-z0-9]/gi, '_');
  const resultPath = `${cacheDir}/${sanitizedId}${ext ? `.${ext}` : ''}`;
  const file = new File(resultPath);
  if (file.exists) {
    return file.name;
  }

  if (isFileURL(media.uri)) {
    try {
      const oldFile = new File(media.uri);
      if (!oldFile.exists) {
        return null;
      }

      oldFile.copy(file);
      return file.name;
    } catch (e) {
      Sentry.captureException(e, {
        data: {
          label: 'copyCoverMediaToCacheDirInternal',
          url: media.uri,
          media,
        },
      });
      throw e;
    }
  }
  const resultFile = await downloadRemoteFileToLocalCache(
    media.uri,
    abortSignal,
    file,
  );
  if (resultFile) {
    return file.name;
  }
  return null;
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
