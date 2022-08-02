import { getVideoUrlForSize } from '@azzapp/shared/lib/imagesHelpers';
import omit from 'lodash/omit';
import { useEffect, useRef } from 'react';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { MediaInnerRendererProps } from './types';

const MediaVideoRenderer = ({
  source,
  muted = false,
  repeat = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mediaRef,
  paused,
  currentTime,
  width,
  aspectRatio,
  style,
  onEnd,
  onReadyForDisplay,
  onProgress: onProgressProp,
  ...props
}: MediaInnerRendererProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (paused) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play().catch(() => null);
    }
  }, [paused]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime ?? 0;
    }
  }, [currentTime]);

  const onEnded = () => {
    onEnd?.();
    if (repeat && videoRef.current) {
      videoRef.current.currentTime = currentTime ?? 0;
      videoRef.current.play().catch(() => null);
    }
  };

  const onProgress = () => {
    const video = videoRef.current;
    // TODO check the validity of the conversion
    onProgressProp?.({
      currentTime: video?.currentTime ?? 0,
      playableDuration: video?.playbackRate ?? 0,
      seekableDuration: video?.seekable?.length ?? 0,
    });
  };

  const height =
    typeof width === 'number'
      ? width / aspectRatio
      : `calc(${width} / ${aspectRatio})`;

  const src =
    typeof width === 'number'
      ? getVideoUrlForSize(source, width, 2, aspectRatio)
      : getVideoUrlForSize(source);

  return createHTMLElement('video', {
    ref: videoRef,
    playsInline: true,
    autoPlay: true,
    loop: false,
    muted,
    src,
    style: [style, { width, height, objectFit: 'cover' } as any],
    onEnded,
    onLoadedData: onReadyForDisplay,
    onProgress,
    ...omit(props, 'allowsExternalPlayback', 'playWhenInactive', 'uri'),
  });
};

export default MediaVideoRenderer;
