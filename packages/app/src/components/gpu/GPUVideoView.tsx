import { forwardRef, useRef, useImperativeHandle } from 'react';
import { findNodeHandle } from 'react-native';
import { useChildrenLayers } from './GPULayers';
import { exportViewVideo } from './GPUNativeMethods';
import NativeGPUVideoView from './NativeGPUVideoView';
import type { GPULayer } from './GPULayers';
import type { ExportVideoOptions } from './GPUNativeMethods';
import type { NativeGPUVideoViewProps } from './NativeGPUVideoView';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

export type GPUVideoViewProps = Omit<NativeGPUVideoViewProps, 'layers'> & {
  children?: React.ReactNode;
  layers?: GPULayer[];
};

export type GPUVideoViewHandle = {
  exportVideo: (options: ExportVideoOptions) => Promise<string>;
};

const GPUVideoView = (
  { children, layers, ...props }: GPUVideoViewProps,
  ref: ForwardedRef<GPUVideoViewHandle>,
) => {
  const childrenLayers = useChildrenLayers(children);
  layers = layers ? [...childrenLayers, ...layers] : childrenLayers;
  const nativeViewRef = useRef<HostComponent<NativeGPUVideoViewProps>>(null);
  useImperativeHandle(
    ref,
    () => ({
      exportVideo(options) {
        const nodeHandle = findNodeHandle(nativeViewRef.current);
        if (nodeHandle == null || nodeHandle === -1) {
          throw new Error('Could not get the GPUVideoView native view tag');
        }
        return exportViewVideo(nodeHandle, options);
      },
    }),
    [],
  );

  return (
    <NativeGPUVideoView {...props} ref={nativeViewRef as any} layers={layers} />
  );
};

export default forwardRef(GPUVideoView);
