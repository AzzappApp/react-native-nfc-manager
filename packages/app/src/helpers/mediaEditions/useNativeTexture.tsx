import { useEffect, useState } from 'react';
import useLatestCallback from '#hooks/useLatestCallback';
import NativeTextureLoader from './NativeTextureLoader';
import type { TextureInfo } from './NativeTextureLoader';

const useNativeTexture = ({
  uri,
  kind,
  maxSize,
  time = 0,
  onLoad,
  onError,
}: {
  uri: string | null | undefined;
  kind: 'image' | 'video' | null | undefined;
  maxSize?: { width: number; height: number } | null | undefined;
  time?: number | null | undefined;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
}) => {
  const [textureInfo, setTextureInfo] = useState<TextureInfo | null>(null);
  const onLoadInner = useLatestCallback(onLoad);
  const onErrorInner = useLatestCallback(onError);
  useEffect(() => {
    let canceled = false;
    setTextureInfo(null);
    let refKey: string | null = null;
    if (uri && kind) {
      const { key, promise } =
        kind === 'image'
          ? NativeTextureLoader.loadImage(uri, maxSize)
          : NativeTextureLoader.loadVideoThumbnail(uri, time ?? 0, maxSize);
      promise.then(
        image => {
          if (canceled) {
            return;
          }
          refKey = key;
          NativeTextureLoader.ref(key);
          setTextureInfo(image);
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
        NativeTextureLoader.unref(refKey);
      }
    };
  }, [uri, kind, time, onLoadInner, onErrorInner, maxSize]);

  return textureInfo;
};

export default useNativeTexture;
