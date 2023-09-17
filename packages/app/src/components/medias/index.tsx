import MediaImageRenderer from './MediaImageRenderer';
import { createPrefetecher } from './MediaPrefetcher';
import MediaVideoRenderer from './MediaVideoRenderer';
import {
  cancelPrefetch as cancelImagePrefetch,
  obervePrefetchResult as oberveImagePrefetchResult,
  prefetch as prefetchImageInternal,
  addLocalCachedFile as addLocalCachedImageFile,
} from './NativeMediaImageRenderer';
import {
  cancelPrefetch as cancelVideoPrefetch,
  obervePrefetchResult as observerVideoPrefetchResult,
  prefetch as prefetchVideoInternal,
  addLocalCachedFile as addLocalCachedVideoFile,
} from './NativeMediaVideoRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
  MediaImageRendererProps,
} from './mediasTypes';

const prefetchImage = createPrefetecher(
  prefetchImageInternal,
  oberveImagePrefetchResult,
  cancelImagePrefetch,
);

const prefetchVideo = createPrefetecher(
  prefetchVideoInternal,
  observerVideoPrefetchResult,
  cancelVideoPrefetch,
);

const addLocalCachedMediaFile = (
  mediaId: string,
  kind: 'image' | 'video',
  localURI: string,
) => {
  if (kind === 'video') {
    addLocalCachedVideoFile(mediaId, localURI);
  } else {
    addLocalCachedImageFile(mediaId, localURI);
  }
};

export {
  MediaImageRenderer,
  MediaVideoRenderer,
  prefetchImage,
  prefetchVideo,
  addLocalCachedMediaFile,
};

export type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
  MediaImageRendererProps,
};
