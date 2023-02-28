import React, { useEffect, useRef } from 'react';
import {
  requireNativeComponent,
  NativeModules,
  findNodeHandle,
  Platform,
} from 'react-native';
import type { ViewProps, HostComponent } from 'react-native';

export type SnapshotViewProps = Omit<ViewProps, 'children'> & {
  snapshotID: string;
  clearOnUnmount?: boolean;
};

const NativeSnapshotView: React.ComponentType<SnapshotViewProps> =
  Platform.select({
    ios: requireNativeComponent('AZPSnapshot'),
    default: null as any,
  });

const SnapshotView = ({
  style,
  clearOnUnmount = true,
  snapshotID,
  ...props
}: SnapshotViewProps) => {
  if (Platform.OS !== 'ios') {
    throw new Error('Not Supported');
  }
  const clearOnUnmountRef = useRef(clearOnUnmount);
  clearOnUnmountRef.current = clearOnUnmount;
  useEffect(
    () => () => {
      if (clearOnUnmountRef.current)
        clearShapshot(snapshotID).catch(() => void 0);
    },
    [snapshotID],
  );
  return (
    <NativeSnapshotView
      snapshotID={snapshotID}
      style={[{ overflow: 'hidden' }, style]}
      {...props}
    />
  );
};

export default SnapshotView;

const FAKE_SNAPSHOT_ID = 'FAKE_SNAPSHOT_ID';

export const snapshotView = async (
  viewHandle: HostComponent<any> | number,
): Promise<string> => {
  if (Platform.OS !== 'ios') {
    throw new Error('Not supported');
  }
  if (typeof viewHandle === 'object') {
    const nodeHandle = findNodeHandle(viewHandle);
    if (nodeHandle == null) {
      console.error('Could not find view handle');
      return FAKE_SNAPSHOT_ID;
    }
    viewHandle = nodeHandle;
  }
  return NativeModules.AZPSnapshotManager.snapshotView(viewHandle);
};

export const clearShapshot = async (id: string): Promise<void> => {
  if (id === FAKE_SNAPSHOT_ID) {
    return;
  }
  return NativeModules.AZPSnapshotManager.clearSnapshot(id);
};
