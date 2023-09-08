import { NativeModules, requireNativeComponent } from 'react-native';

/**
 * A native component that allows to display a video, it's a low level component
 * that is used by the MediaVideoRenderer.
 */
const NativeMediaVideoRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaVideoRenderer');

export default NativeMediaVideoRenderer;

const AZPMediaVideoRendererManager = NativeModules.AZPMediaVideoRendererManager;

if (!AZPMediaVideoRendererManager) {
  throw new Error('Failed to bridge MediaVideoRendererManager');
}

export const getPlayerCurrentTime: (reactTag: number) => number =
  AZPMediaVideoRendererManager.getPlayerCurrentTime;

export const prefetch: (uri: string) => Promise<boolean> =
  AZPMediaVideoRendererManager.prefetch;

export const obervePrefetchResult: (uri: string) => Promise<void> =
  AZPMediaVideoRendererManager.obervePrefetchResult;

export const cancelPrefetch: (uri: string) => void =
  AZPMediaVideoRendererManager.cancelPrefetch;

export const addLocalCachedFile: (mediaId: string, path: string) => void =
  AZPMediaVideoRendererManager.addLocalCachedFile;
