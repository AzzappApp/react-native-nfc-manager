import omit from 'lodash/omit';
import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { queryMediaCache, addMediaCacheEntry } from './mediaCache';
import type { MediaInnerRendererProps } from './types';

const MediaImageRenderer = ({
  uri,
  source,
  width,
  onLoad,
  onReadyForDisplay,
  mediaRef,
  ...props
}: MediaInnerRendererProps) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }
  const [displayedURI, setDisplayedURI] = useState<string | null>(null);

  const isReady = useRef(false);
  const onImageLoad = () => {
    if (displayedURI === uri) {
      onLoad?.();
      if (!isReady.current) {
        onReadyForDisplay?.();
        isReady.current = true;
      }
    } else {
      onReadyForDisplay?.();
      isReady.current = true;
    }
  };
  useEffect(() => {
    if (!uri) {
      console.error('MediaRenderer should not be rendered withour URI');
      return;
    }
    setDisplayedURI(null);
    const { inCache, alternateURI } = queryMediaCache(source, width as number);
    if (inCache) {
      setDisplayedURI(uri);
      return;
    }
    if (alternateURI) {
      setDisplayedURI(alternateURI);
    }
    Image.prefetch(uri).then(
      () => {
        setDisplayedURI(uri);
        addMediaCacheEntry(source, width as number, uri);
      },
      () => {
        // TODO handle errors, perhaps retry ?
      },
    );
  }, [source, uri, width]);

  return (
    <Image
      // @ts-expect-error bad ref type
      ref={mediaRef}
      source={(displayedURI ? { uri: displayedURI } : null) as any}
      onLoad={onImageLoad}
      {...omit(props, [
        'paused',
        'muted',
        'repeat',
        'playWhenInactive',
        'allowsExternalPlayback',
        'currentTime',
        'onEnd',
        'onProgress',
      ])}
    />
  );
};

export default MediaImageRenderer;
