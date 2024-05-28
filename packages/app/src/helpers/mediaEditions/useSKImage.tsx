import { useEffect, useState } from 'react';
import useLatestCallback from '#hooks/useLatestCallback';
import SKImageLoader from './SKImageLoader';
import type { SkImage } from '@shopify/react-native-skia';

const useSkImage = ({
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
  const [skImage, setSkImage] = useState<SkImage | null>(null);
  const onLoadInner = useLatestCallback(onLoad);
  const onErrorInner = useLatestCallback(onError);
  useEffect(() => {
    let canceled = false;
    setSkImage(null);
    let refKey: string | null = null;
    if (uri && kind) {
      const { key, promise } =
        kind === 'image'
          ? { key: uri, promise: SKImageLoader.loadImage(uri) }
          : SKImageLoader.loadVideoThumbnail(
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
          SKImageLoader.refImage(key);
          setSkImage(image);
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
        SKImageLoader.unrefImage(refKey);
      }
    };
  }, [uri, kind, time, onLoadInner, onErrorInner, maxVideoThumbnailSize]);

  return skImage;
};

export default useSkImage;
