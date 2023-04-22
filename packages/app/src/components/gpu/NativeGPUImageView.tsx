import { requireNativeComponent } from 'react-native';
import type { GPULayer } from './GPULayers';
import type { ViewProps } from 'react-native';

export type NativeGPUImageViewProps = Omit<ViewProps, 'children'> & {
  layers?: GPULayer[];
  onLoad?: () => void;
  onLoadStart?: () => void;
  onError?: (error: Error | null) => void;
};

const NativeGPUImageView =
  requireNativeComponent<NativeGPUImageViewProps>('AZPGPUImageView');

export default NativeGPUImageView;
