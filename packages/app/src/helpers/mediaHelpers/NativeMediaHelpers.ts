import { NativeModules, Platform } from 'react-native';
import * as AndroidLocalMediaCache from './AndroidLocalMediaCache';
import { createPrefetecher } from './MediaPrefetcher';

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
) => Promise<{ width: number; height: number }> = AZPMediaHelpers.getVideoSize;

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
 * Computes a mask for an image based on selfie segmentation.
 *
 * @param uri The URI of the image.
 * @returns A promise that resolves with the path of the mask.
 */
export const segmentImage: (uri: string) => Promise<string | null> =
  AZPMediaHelpers.segmentImage;

/**
 * Prefetches an image.
 * returns an observable that will complete when the prefetch is done.
 * If the observable is unsubscribed before the prefetch is done, the prefetch will be cancelled.
 */
export const prefetchImage = createPrefetecher(
  AZPMediaHelpers.prefetchImage,
  AZPMediaHelpers.observeImagePrefetchResult,
  AZPMediaHelpers.cancelImagePrefetch,
);

/**
 * Prefetches an video.
 * returns an observable that will complete when the prefetch is done.
 * If the observable is unsubscribed before the prefetch is done, the prefetch will be cancelled.
 */
export const prefetchVideo = createPrefetecher(
  AZPMediaHelpers.prefetchVideo,
  AZPMediaHelpers.observeVideoPrefetchResult,
  AZPMediaHelpers.cancelVideoPrefetch,
);

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
  if (Platform.OS === 'android') {
    AndroidLocalMediaCache.addLocalCachedMediaFile(mediaId, kind, localURI);
  } else if (kind === 'video') {
    AZPMediaHelpers.addLocalCachedVideo(mediaId, localURI);
  } else {
    AZPMediaHelpers.addLocalCachedImage(mediaId, localURI);
  }
};
