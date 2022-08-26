import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  StyleSheet,
  View,
} from 'react-native';
import { queryMediaCache } from './mediaCache';
import type { ForwardedRef } from 'react';
import type { ViewProps, NativeSyntheticEvent } from 'react-native';

export type MediaVideoRendererProps = ViewProps & {
  uri?: string;
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  paused?: boolean;
  muted?: boolean;
  currentTime?: number;
  onReadyForDisplay?: () => void;
  onEnd?: () => void;
  onProgress?: (event: NativeSyntheticEvent<{ currentTime: number }>) => void;
};

export type MediaVideoRendererHandle = {
  getContainer(): View | null;
  getPlayerCurrentTime(): Promise<number | null>;
};

const MediaVideoRenderer = (
  {
    uri,
    source,
    width,
    aspectRatio,
    muted = false,
    paused = false,
    style,
    ...props
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }

  const videoRef = useRef<any>();
  const containerRef = useRef<View>(null);

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

  const displayedURI = useMemo(() => {
    if (!uri) {
      console.error('MediaRenderer should not be rendered withour URI');
    }
    /**
     * Video cache only works when we use a video that we just uploaded
     * We don't use the same tricks with image since prefetching video
     * is too expensive and synchronizing play time would be error prone
     */
    const { inCache, alternateURI } = queryMediaCache(source, width as number);
    if (inCache || !alternateURI) {
      return uri;
    }
    return alternateURI;
  }, [source, uri, width]);

  return (
    <View
      style={[style, { width, aspectRatio, overflow: 'hidden' }]}
      ref={containerRef}
    >
      <NativeMediaVideoRenderer
        ref={videoRef}
        uri={displayedURI}
        muted={muted}
        paused={paused}
        {...props}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

export default forwardRef(MediaVideoRenderer);

const NativeMediaVideoRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaVideoRenderer');
