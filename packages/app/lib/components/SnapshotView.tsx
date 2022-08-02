import React from 'react';
import { requireNativeComponent, NativeModules } from 'react-native';
import type { ViewProps, HostComponent } from 'react-native';

export type SnapshotViewProps = Omit<ViewProps, 'children'> & {
  snapshotID: string;
};

const NativeSnapshotView: React.ComponentType<SnapshotViewProps> =
  requireNativeComponent('AZPSnapshot');

const SnapshotView = ({ style, ...props }: SnapshotViewProps) => {
  return (
    <NativeSnapshotView style={[{ overflow: 'hidden' }, style]} {...props} />
  );
};

export default SnapshotView;

export const snapshotView = (
  viewHandle: HostComponent<any> | number,
): Promise<string> => {
  if (typeof viewHandle === 'object') {
    const instance = viewHandle as any;
    if (instance._nativeTag) {
      viewHandle = instance._nativeTag as number;
    }
  }
  return NativeModules.AZPSnapshotManager.snapshotView(viewHandle);
};

export const clearShapshot = (id: string): void => {
  return NativeModules.AZPSnapshotManager.clearSnapshot(id);
};
