import { NativeModules, Platform } from 'react-native';
import { createExpoImagePrefetcher } from './MediaPrefetcher';

const { AZPMediaHelpers } = NativeModules;

if (!AZPMediaHelpers) {
  throw new Error('Failed to bridge AZPMediaHelpers');
}

/**
 * Returns the size of a video.
 * @param uri The URI of the video.
 * @returns A promise that resolves with the size of the video.
 */
export const getVideoSize: (
  uri: string,
) => Promise<{ width: number; height: number; rotation: number }> =
  AZPMediaHelpers.getVideoSize;

export const getFilePath: (uri: string) => Promise<string> =
  AZPMediaHelpers.getFilePath;

export const downloadContactImage: (uri: string) => Promise<string> =
  Platform.OS === 'android'
    ? AZPMediaHelpers.downloadContactImage
    : () => {
        console.warn('downloadContactImage is android specific');
      };

export const copyAsset: (
  fileName: string,
  cacheDir: string,
) => Promise<string> =
  Platform.OS === 'android'
    ? AZPMediaHelpers.copyAsset
    : () => {
        console.warn('copyAsset is android specific');
      };

/**
 * Prefetches an image.
 * returns an observable that will complete when the prefetch is done.
 * If the observable is unsubscribed before the prefetch is done, the prefetch will be cancelled.
 */
export const prefetchImage = createExpoImagePrefetcher();
