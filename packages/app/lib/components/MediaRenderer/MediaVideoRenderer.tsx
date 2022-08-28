import LRUCache from 'lru-cache';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  StyleSheet,
  View,
} from 'react-native';
import MediaImageRenderer from './MediaImageRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from './types';
import type { ForwardedRef } from 'react';

const MediaVideoRenderer = (
  {
    uri,
    thumbnailURI,
    source,
    width,
    aspectRatio,
    muted = false,
    paused = false,
    style,
    onReadyForDisplay,
    ...props
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }

  const isReadyForDisplay = useRef(false);
  const [videoReady, setVideoReady] = useState(false);

  const dispatchReady = () => {
    if (!isReadyForDisplay.current) {
      isReadyForDisplay.current = true;
      onReadyForDisplay?.();
    }
  };

  const onVideoReadyForDisplay = () => {
    setVideoReady(true);
    dispatchReady();
  };

  const sourceRef = useRef(source);
  // we need to clean the state to start loading
  // the placeholder
  if (sourceRef.current !== source) {
    setVideoReady(false);
    sourceRef.current = source;
    isReadyForDisplay.current = false;
  }

  const videoRef = useRef<any>();
  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      getContainer() {
        return containerRef.current;
      },
      async getPlayerCurrentTime() {
        if (videoRef.current) {
          const data =
            await NativeModules.AZPMediaVideoRendererManager.getPlayerCurrentTime(
              findNodeHandle(videoRef.current),
            );
          return data?.currentTime ?? null;
        }
        return null;
      },
    }),
    [],
  );

  return (
    <View
      style={[style, { width, aspectRatio, overflow: 'hidden' }]}
      ref={containerRef}
    >
      <NativeMediaVideoRenderer
        ref={videoRef}
        // TODO if file is purged by system problem may arise
        uri={localVideoFile.get(source) ?? uri}
        muted={muted}
        paused={paused}
        onReadyForDisplay={onVideoReadyForDisplay}
        {...props}
        style={StyleSheet.absoluteFill}
      />
      {!videoReady && thumbnailURI && (
        <MediaImageRenderer
          source={source}
          aspectRatio={aspectRatio}
          width={width}
          uri={thumbnailURI}
          onReadyForDisplay={dispatchReady}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
        />
      )}
    </View>
  );
};

export default forwardRef(MediaVideoRenderer);

const NativeMediaVideoRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaVideoRenderer');

const localVideoFile = new LRUCache<string, string>({ max: 1000 });

export const addLocalVideo = (mediaID: string, localURI: string) => {
  localVideoFile.set(mediaID, localURI);
};
