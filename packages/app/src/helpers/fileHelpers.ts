import ReactNativeBlobUtil from 'react-native-blob-util';
import { createId } from './idHelpers';

/**
 * Get file name from path
 * @param path - file path
 * @returns file name
 */
export const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};

/**
 * return true if url is file url
 * @param url - url
 * @returns true if url is file url
 */
export const isFileURL = (url: string) => {
  return url.startsWith('file://');
};

/**
 * Create random file path with given extension in the cache directory
 */
export const createRandomFilePath = (ext: string) =>
  `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${createId()}.${ext}`;
