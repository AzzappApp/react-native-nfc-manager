import { useEffect, useState } from 'react';
import useLatestCallback from '#hooks/useLatestCallback';
import NativeBufferLoader from './NativeBufferLoader';

const useNativeBuffer = ({
  uri,
  kind,
  maxVideoThumbnailSize,
  time = 0,
  onLoad,
  onError,
}: {
  uri: string | null | undefined;
  kind: 'image' | 'video' | null | undefined;
  maxVideoThumbnailSize?: { width: number; height: number } | null | undefined;
  time?: number | null | undefined;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
}) => {
  const [image, setImage] = useState<bigint | null>(null);
  const onLoadInner = useLatestCallback(onLoad);
  const onErrorInner = useLatestCallback(onError);
  useEffect(() => {
    let canceled = false;
    setImage(null);
    let refKey: string | null = null;
    if (uri && kind) {
      const { key, promise } =
        kind === 'image'
          ? { key: uri, promise: NativeBufferLoader.loadImage(uri) }
          : NativeBufferLoader.loadVideoThumbnail(
              uri,
              time ?? 0,
              maxVideoThumbnailSize,
            );
      promise.then(
        image => {
          if (canceled) {
            return;
          }
          refKey = key;
          NativeBufferLoader.ref(key);
          setImage(image);
          onLoadInner();
        },
        err => {
          if (canceled) {
            return;
          }
          onErrorInner(err);
        },
      );
    }
    return () => {
      canceled = true;
      if (refKey) {
        NativeBufferLoader.unref(refKey);
      }
    };
  }, [uri, kind, time, onLoadInner, onErrorInner, maxVideoThumbnailSize]);

  return image;
};

export default useNativeBuffer;
