import NativeGPUImageView from './NativeGPUImageView';
import { useChildrenLayers } from '.';
import type { GPULayer } from '.';
import type { NativeGPUImageViewProps } from './NativeGPUImageView';

export type GPUImageViewProps = Omit<NativeGPUImageViewProps, 'layers'> & {
  children?: React.ReactNode;
  layers?: GPULayer[];
};

const GPUImageView = ({ children, layers, ...props }: GPUImageViewProps) => {
  const childrenLayers = useChildrenLayers(children);
  layers = layers ? [...childrenLayers, ...layers] : childrenLayers;

  return <NativeGPUImageView {...props} layers={layers} />;
};

export default GPUImageView;
