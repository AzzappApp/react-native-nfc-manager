/**
 * A cache for local media files
 */

import { useEffect, useState } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';

const localImageCache = new Map<string, string>();
const localVideoCache = new Map<string, string>();

export const addLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
  localURI: string,
) => {
  const cache = kind === 'image' ? localImageCache : localVideoCache;
  cache.set(mediaId, localURI);
};

export const deleteLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
) => {
  const cache = kind === 'image' ? localImageCache : localVideoCache;
  cache.delete(mediaId);
};

export const getLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
) => {
  const cache = kind === 'image' ? localImageCache : localVideoCache;

  return cache.get(mediaId);
};

export const useLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
) => {
  const [, forceRender] = useState(0);
  const localFile = getLocalCachedMediaFile(mediaId, kind);

  useEffect(() => {
    let cancelled = false;
    if (localFile) {
      ReactNativeBlobUtil.fs
        .exists(localFile)
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
