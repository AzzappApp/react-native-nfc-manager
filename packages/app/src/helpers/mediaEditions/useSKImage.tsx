import { useEffect, useState } from 'react';
import useLatestCallback from '#hooks/useLatestCallback';
import SKImageLoader from './SKImageLoader';
import type { SkImage } from '@shopify/react-native-skia';

const useSkImage = ({
  uri,
  kind,
  time = 0,
  onLoad,
  onError,
}: {
  uri: string | null | undefined;
  kind: 'image' | 'video' | null | undefined;
  time?: number | null | undefined;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
}) => {
  const [skImage, setSkImage] = useState<SkImage | null>(null);
  const onLoadInner = useLatestCallback(onLoad);
  const onErrorInner = useLatestCallback(onError);
  useEffect(() => {
    let canceled = false;
    let hasRef = false;
    setSkImage(null);
    if (uri && kind) {
      const promise =
        kind === 'image'
          ? SKImageLoader.loadImage(uri)
          : SKImageLoader.loadVideoThumbnail(uri, time ?? 0);
      promise.then(
        image => {
          if (canceled) {
            return;
          }
          SKImageLoader.refImage(uri);
          hasRef = true;
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
      if (uri && hasRef) {
        SKImageLoader.unrefImage(uri);
      }
    };
  }, [uri, kind, time, onLoadInner, onErrorInner]);

  return skImage;
};

export default useSkImage;
