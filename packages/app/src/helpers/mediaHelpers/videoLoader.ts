import { useEffect, useState } from 'react';
import { isFileURL } from '#helpers/fileHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import { downloadRemoteFileToLocalCache, FILE_CACHE_DIR } from './mediaHelpers';

const videoCache = new Map<string, string>();

export const getVideoLocalPath = async (
  uri: string,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  if (isFileURL(uri)) {
    return uri;
  }

  if (!videoCache.has(uri)) {
    const file = await downloadRemoteFileToLocalCache(uri, abortSignal);
    if (file) {
      videoCache.set(uri, file.name);
    }
  }

  return `${FILE_CACHE_DIR}/${videoCache.get(uri)}`;
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
