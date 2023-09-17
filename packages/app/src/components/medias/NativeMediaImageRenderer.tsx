import { NativeModules, requireNativeComponent } from 'react-native';

/**
 * A native component that allows to display an image, it's a low level component
 * that is used by the MediaImageRenderer.
 */
const NativeMediaImageRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaImageRenderer');

export default NativeMediaImageRenderer;

const AZPMediaImageRendererManager = NativeModules.AZPMediaImageRendererManager;

if (!AZPMediaImageRendererManager) {
  throw new Error('Failed to bridge MediaImageRendererManager');
}

export const getPlayerCurrentTime: (reactTag: number) => number =
  AZPMediaImageRendererManager.getPlayerCurrentTime;

export const prefetch: (uri: string) => Promise<boolean> =
  AZPMediaImageRendererManager.prefetch;

export const obervePrefetchResult: (uri: string) => Promise<void> =
  AZPMediaImageRendererManager.obervePrefetchResult;

export const cancelPrefetch: (uri: string) => void =
  AZPMediaImageRendererManager.cancelPrefetch;

export const addLocalCachedFile: (mediaId: string, path: string) => void =
  AZPMediaImageRendererManager.addLocalCachedFile;
