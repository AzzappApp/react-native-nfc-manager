import { requireNativeComponent } from 'react-native';

/**
 * A native component that allows to display an image, it's a low level component
 * that is used by the MediaImageRenderer.
 */
const NativeMediaImageRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaImageRenderer');

export default NativeMediaImageRenderer;

export const getPlayerCurrentTime: (reactTag: number) => number = jest.fn();

export const prefetch: (uri: string) => Promise<boolean> = jest.fn();

export const observePrefetchResult: (uri: string) => Promise<void> = jest.fn();

export const cancelPrefetch: (uri: string) => void = jest.fn();

export const addLocalCachedFile: (mediaId: string, path: string) => void =
  jest.fn();
