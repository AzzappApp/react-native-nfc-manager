import { forwardRef, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { queryMediaCache, addMediaCacheEntry } from './mediaCache';
import type { ForwardedRef } from 'react';
import type {
  ImageProps,
  NativeSyntheticEvent,
  ImageLoadEventData,
} from 'react-native';

export type MediaInnerRendererProps = Omit<ImageProps, 'source'> & {
  uri?: string;
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  onReadyForDisplay?: () => void;
};

const MediaImageRenderer = (
  {
    uri,
    source,
    width,
    aspectRatio,
    onLoad,
    onReadyForDisplay,
    style,
    ...props
  }: MediaInnerRendererProps,
  ref: ForwardedRef<Image>,
) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }
  const [displayedURI, setDisplayedURI] = useState<string | null>(() => {
    if (!uri) {
      return null;
    }
    const { inCache, alternateURI } = queryMediaCache(source, width as number);
    if (inCache) {
      return uri;
    }
    return alternateURI ?? null;
  });

  const isReady = useRef(false);
  const onImageLoad = (event: NativeSyntheticEvent<ImageLoadEventData>) => {
    if (displayedURI === uri) {
      onLoad?.(event);
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
      ref={ref}
      source={(displayedURI ? { uri: displayedURI } : null) as any}
      onLoad={onImageLoad}
      style={[style, { aspectRatio, width, resizeMode: 'cover' }]}
      {...props}
    />
  );
};

export default forwardRef(MediaImageRenderer);
