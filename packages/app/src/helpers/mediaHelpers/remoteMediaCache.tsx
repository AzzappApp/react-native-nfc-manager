import { File } from 'expo-file-system/next';
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

  const localFile = cache.get(mediaId);
  if (localFile) {
    const file = new File(localFile);
    const exists = file.exists;
    if (!exists) {
      deleteLocalCachedMediaFile(mediaId, kind);
      return undefined;
    }
  }
  return localFile;
};
