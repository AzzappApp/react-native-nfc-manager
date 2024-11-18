import { useEffect, useState } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in JSDoc
  MediaImageRenderer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in JSDoc
  MediaVideoRenderer,
} from '#components/medias';

const localImageCache = new Map<string, string>();
const localVideoCache = new Map<string, string>();

/**
 * Add a remote media file to the local cache.
 * Those media will be used to display the media in {@link MediaImageRenderer} or {@link MediaVideoRenderer}
 * in place of the remote media while it is loading.
 *
 * @param mediaId the id of the media file
 * @param kind the kind of media file (image or video)
 * @param localURI the local URI of the media file
 */
export const addLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
  localURI: string,
) => {
  const cache = kind === 'image' ? localImageCache : localVideoCache;
  cache.set(mediaId, localURI);
};

/**
 * Delete a media file from the local cache.
 *
 * @param mediaId - the id of the media file
 * @param kind - the kind of media file (image or video)
 */
export const deleteLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
) => {
  const cache = kind === 'image' ? localImageCache : localVideoCache;
  cache.delete(mediaId);
};

/**
 * Retrieve a local cached media file.
 *
 * @param mediaId the id of the media file
 * @param kind the kind of media file (image or video)
 *
 * @returns the local URI of the media file if it is in the cache, or undefined otherwise
 */
export const getLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
) => {
  const cache = kind === 'image' ? localImageCache : localVideoCache;

  return cache.get(mediaId);
};

/**
 * A hook to retrieve a local cached media file.
 * It will return the local URI of the media file if it is in the cache, or undefined otherwise.
 * It will also check if the file is still present on the device, and remove it from the cache if it is not.
 *
 * :warning: This hook is intended to be used in the context of the {@link MediaImageRenderer} and {@link MediaVideoRenderer} components.
 * And should not be used in other contexts.
 *
 * @param mediaId the id of the media file
 * @param kind the kind of media file (image or video)
 * @returns the local URI of the media file if it is in the cache, or undefined otherwise
 */
export const useLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
) => {
  const [, forceRender] = useState(0);
  const localFile = getLocalCachedMediaFile(mediaId, kind);

  useEffect(() => {
    let cancelled = false;
    if (localFile) {
      const path = localFile.replace('file://', '');
      ReactNativeBlobUtil.fs
        .exists(path)
        .catch(() => false)
        .then(exists => {
          if (!exists) {
            deleteLocalCachedMediaFile(mediaId, kind);
            if (!cancelled) {
              forceRender(v => v + 1);
            }
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [kind, localFile, mediaId]);
  return localFile;
};
