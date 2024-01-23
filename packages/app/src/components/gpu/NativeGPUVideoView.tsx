import { requireNativeComponent } from 'react-native';
import type { GPULayer } from './GPULayers';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

export type NativeGPUVideoViewProps = Omit<ViewProps, 'children'> & {
  layers?: GPULayer[];
  paused?: boolean;
  onImagesLoadingStart?: () => void;
  onImagesLoaded?: () => void;
  onPlayerStartBuffing?: () => void;
  onPlayerReady?: () => void;
  /**
   * A callback called while the video is playing, allowing to track the current time
   */
  onProgress?: (
    event: NativeSyntheticEvent<{ currentTime: number; duration: number }>,
  ) => void;
  onError?: (error: Error | null) => void;
};

const NativeGPUVideoView =
  requireNativeComponent<NativeGPUVideoViewProps>('AZPGPUVideoView');

export default NativeGPUVideoView;
