import { useChildrenLayers } from './GPULayers';
import NativeGPUVideoView from './NativeGPUVideoView';
import type { GPULayer } from './GPULayers';
import type { NativeGPUVideoViewProps } from './NativeGPUVideoView';

export type GPUVideoViewProps = Omit<NativeGPUVideoViewProps, 'layers'> & {
  children?: React.ReactNode;
  layers?: GPULayer[];
};

const GPUVideoView = ({ children, layers, ...props }: GPUVideoViewProps) => {
  const childrenLayers = useChildrenLayers(children);
  layers = layers ? [...childrenLayers, ...layers] : childrenLayers;

  return <NativeGPUVideoView {...props} layers={layers} />;
};

export default GPUVideoView;
