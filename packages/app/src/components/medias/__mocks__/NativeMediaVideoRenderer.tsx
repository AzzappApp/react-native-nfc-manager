import { requireNativeComponent } from 'react-native';

/**
 * A native component that allows to display a video, it's a low level component
 * that is used by the MediaVideoRenderer.
 */
const NativeMediaVideoRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaVideoRenderer');

export default NativeMediaVideoRenderer;

export const getPlayerCurrentTime: (reactTag: number) => number = jest.fn();

export const prefetch: (uri: string) => Promise<boolean> = jest.fn();

export const obervePrefetchResult: (uri: string) => Promise<void> = jest.fn();

export const cancelPrefetch: (uri: string) => void = jest.fn();

export const addLocalCachedFile: (uri: string, path: string) => void =
  jest.fn();
