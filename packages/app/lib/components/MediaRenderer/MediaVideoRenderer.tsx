import { useEffect, useState } from 'react';
import Video from 'react-native-video';
import { queryMediaCache } from './mediaCache';
import type { MediaInnerRendererProps } from './types';

const MediaVideoRenderer = ({
  uri,
  source,
  width,
  muted = false,
  playWhenInactive = true,
  allowsExternalPlayback = false,
  repeat = false,
  style,
  mediaRef,
  ...props
}: MediaInnerRendererProps) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }
  const videoRef = (video: any) => {
    if (video) {
      if (mediaRef && typeof mediaRef === 'object') {
        (mediaRef as any).current = video._root;
      } else if (typeof mediaRef === 'function') {
        mediaRef(video._root);
      }
    }
  };
  const [displayedURI, setDisplayedURI] = useState<string | undefined>(
    undefined,
  );
  useEffect(() => {
    if (!uri) {
      console.error('MediaRenderer should not be rendered withour URI');
    }
    /**
     * Video cache only works when we use a video that we just uploaded
     * We don't use the same tricks with image since prefetching video
     * is too expensive and synchronizing play time would be error prone
     */
    setDisplayedURI(undefined);
    const { inCache, alternateURI } = queryMediaCache(source, width as number);
    if (inCache || !alternateURI) {
      setDisplayedURI(uri);
      return;
    }
    setDisplayedURI(alternateURI);
  }, [source, uri, width]);

  return (
    <Video
      ref={videoRef}
      source={{ uri: displayedURI }}
      hideShutterView
      resizeMode="cover"
      allowsExternalPlayback={allowsExternalPlayback}
      muted={muted}
      playWhenInactive={playWhenInactive}
      repeat={repeat}
      style={style}
      {...props}
    />
  );
};

export default MediaVideoRenderer;
