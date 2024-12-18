import { useEffect, useState } from 'react';
import useLatestCallback from '#hooks/useLatestCallback';
import { downloadRemoteFileToLocalCache } from './mediaHelpers';

const videoCache = new Map<string, string>();

export const getVideoLocalPath = async (
  uri: string,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  if (uri?.startsWith('file://')) {
    return uri.replace('file://', '');
  }
  if (videoCache.has(uri)) {
    return videoCache.get(uri) ?? null;
  }
  const path = await downloadRemoteFileToLocalCache(uri, abortSignal);
  if (path) {
    videoCache.set(uri, path);
  }
  return path;
};

export const useVideoLocalPath = (
  uri: string | null,
  onLoad?: () => void,
  onError?: (error?: Error) => void,
) => {
  const [path, setPath] = useState<string | null>(null);
  const onLoadInner = useLatestCallback(onLoad);
  const onErrorInner = useLatestCallback(onError);
  useEffect(() => {
    if (!uri) {
      setPath(null);
      return () => {};
    }
    let canceled = false;
    const abortController = new AbortController();
    getVideoLocalPath(uri, abortController.signal).then(
      path => {
        if (canceled) {
          return;
        }
        onLoadInner();
        setPath(path);
      },
      error => {
        if (canceled) {
          return;
        }
        setPath(null);
        onErrorInner(error);
      },
    );
    return () => {
      canceled = true;
      abortController.abort();
    };
  }, [onErrorInner, onLoadInner, uri]);
  return path;
};
