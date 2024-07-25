import { useEffect, useState } from 'react';
import ReactNativeBlobUtil, {
  type FetchBlobResponse,
  type StatefulPromise,
} from 'react-native-blob-util';
import useLatestCallback from '#hooks/useLatestCallback';

const videoCache = new Map<string, string>();

export const getVideoLocalPath = (
  uri: string,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  let canceled = false;
  let promise: StatefulPromise<FetchBlobResponse> | null = null;

  abortSignal?.addEventListener(
    'abort',
    () => {
      canceled = true;
      promise?.cancel();
    },
    { once: true },
  );

  const innerFetch = async () => {
    const cachedFile = videoCache.get(uri);
    if (uri && uri.startsWith('file://')) {
      return uri.slice(7);
    }
    if (
      cachedFile != null &&
      (await ReactNativeBlobUtil.fs.exists(cachedFile))
    ) {
      return cachedFile;
    }
    let ext: string | undefined = uri.split('.').pop()?.split('?')[0];
    ext = ext && ext.length <= 5 ? ext : undefined;
    promise = ReactNativeBlobUtil.config({
      fileCache: true,
      appendExt: ext,
    }).fetch('GET', uri);

    return promise.then(
      response => {
        if (canceled) {
          return null;
        }
        videoCache.set(uri, response.path());
        return response.path();
      },
      error => {
        if (canceled) {
          return null;
        }
        throw error;
      },
    );
  };

  return innerFetch();
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
