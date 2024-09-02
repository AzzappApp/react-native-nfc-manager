import { NativeModules, Platform } from 'react-native';
import * as LocalMediaCache from './LocalMediaCache';
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

/**
 * Returns the real uri of a PHAsset.
 * @ios Only.
 * @param uri The uri of the PHAsset.
 */
export const getPHAssetPath: (uri: string) => Promise<string | null> =
  Platform.select({
    ios: AZPMediaHelpers.getPHAssetPath,
    default: () => {
      throw new Error('getPHAssetPath is only available on iOS');
    },
  });

/**
 * Prefetches an image.
 * returns an observable that will complete when the prefetch is done.
 * If the observable is unsubscribed before the prefetch is done, the prefetch will be cancelled.
 */
export const prefetchImage = createExpoImagePrefetcher();

/**
 * Adds a local cached media file to the cache.
 * This media file will be used instead of downloading the media file from the internet for the given mediaId.
 *
 * @param mediaId - The mediaId of the media file.
 * @param kind - The kind of media file.
 * @param localURI - The local URI of the media file.
 */
export const addLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
  localURI: string,
) => {
  LocalMediaCache.addLocalCachedMediaFile(mediaId, kind, localURI);
};
