import { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle } from 'react-native';
import { exportViewImage } from './GPUNativeMethods';
import NativeGPUImageView from './NativeGPUImageView';
import { useChildrenLayers } from '.';
import type { GPULayer } from '.';
import type { ExportImageOptions } from './GPUNativeMethods';
import type { NativeGPUImageViewProps } from './NativeGPUImageView';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

export type GPUImageViewProps = Omit<NativeGPUImageViewProps, 'layers'> & {
  children?: React.ReactNode;
  layers?: GPULayer[];
};

export type GPUImageViewHandle = {
  exportImage: (options: ExportImageOptions) => Promise<string>;
};

const GPUImageView = (
  { children, layers, ...props }: GPUImageViewProps,
  ref: ForwardedRef<GPUImageViewHandle>,
) => {
  const childrenLayers = useChildrenLayers(children);
  layers = layers ? [...childrenLayers, ...layers] : childrenLayers;
  const nativeViewRef = useRef<HostComponent<NativeGPUImageViewProps>>(null);

  useImperativeHandle(
    ref,
    () => ({
      exportImage(options) {
        const nodeHandle = findNodeHandle(nativeViewRef.current);
        if (nodeHandle == null || nodeHandle === -1) {
          throw new Error('Could not get the GPUImageView native view tag');
        }

        return exportViewImage(nodeHandle, options);
      },
    }),
    [],
  );

  return (
    <NativeGPUImageView {...props} ref={nativeViewRef as any} layers={layers} />
  );
};

export default forwardRef(GPUImageView);
