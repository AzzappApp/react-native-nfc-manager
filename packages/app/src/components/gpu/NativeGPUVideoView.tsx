import { requireNativeComponent } from 'react-native';
import type { GPULayer } from './GPULayers';
import type { ViewProps } from 'react-native';

export type NativeGPUVideoViewProps = Omit<ViewProps, 'children'> & {
  layers?: GPULayer[];
  paused?: boolean;
  onImagesLoadingStart?: () => void;
  onImagesLoaded?: () => void;
  onPlayerStartBuffing?: () => void;
  onPlayerReady?: () => void;
  onError?: (error: Error | null) => void;
};

const NativeGPUVideoView =
  requireNativeComponent<NativeGPUVideoViewProps>('AZPGPUVideoView');

export default NativeGPUVideoView;
