import React, { useEffect, useRef } from 'react';
import {
  requireNativeComponent,
  NativeModules,
  findNodeHandle,
  Platform,
} from 'react-native';
import type { ViewProps, HostComponent } from 'react-native';

export type SnapshotViewProps = Omit<ViewProps, 'children'> & {
  /**
   * The ID of the snapshot to render.
   * This ID is returned by the `snapshotView` function.
   */
  snapshotID: string;
  /**
   * Whether to clear the snapshot on unmount.
   * Defaults to true.
   */
  clearOnUnmount?: boolean;
};

/**
 * A view that renders a snapshot of a view.
 * iOS only for now.
 */
const SnapshotView = ({
  snapshotID,
  clearOnUnmount = true,
  style,
  ...props
}: SnapshotViewProps) => {
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

const AZPSnapshotModule =
  Platform.OS === 'ios'
    ? NativeModules.AZPSnapshotManager
    : NativeModules.AZPSnapshotModule;

/**
 * Snapshots a view and returns a promise that resolves to the snapshot ID.
 * This ID can be used to render the snapshot using the `SnapshotView` component.
 * iOS only for now.
 *
 * @param viewHandle The view to snapshot
 * @returns a promise that resolves to the snapshot ID
 */
export const snapshotView = async (
  viewHandle: HostComponent<any> | number,
): Promise<string> => {
  if (typeof viewHandle === 'object') {
    const nodeHandle = findNodeHandle(viewHandle);
    if (nodeHandle == null) {
      console.error('Could not find view handle');
      return FAKE_SNAPSHOT_ID;
    }
    viewHandle = nodeHandle;
  }

  return AZPSnapshotModule.snapshotView(viewHandle);
};

/**
 * Clears a snapshot. (releases it from memory)
 *
 * @param id
 */
export const clearShapshot = async (id: string): Promise<void> => {
  if (id === FAKE_SNAPSHOT_ID) {
    return;
  }
  return AZPSnapshotModule.clearSnapshot(id);
};

console.log(NativeModules);

const NativeSnapshotView: React.ComponentType<SnapshotViewProps> =
  requireNativeComponent('AZPSnapshot');
