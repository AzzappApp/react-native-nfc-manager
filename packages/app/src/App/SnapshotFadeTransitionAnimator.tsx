import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  captureSnapshot,
  SnapshotRenderer,
} from '@azzapp/react-native-snapshot-view';
import { waitTime } from '@azzapp/shared/asyncHelpers';

export type SnapshotFadeTransitionAnimatorProps = {
  routesMap: Record<string, React.ReactElement>;
  route: string;
};

const SnapshotFadeTransitionAnimator = ({
  routesMap,
  route,
}: SnapshotFadeTransitionAnimatorProps) => {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [innerRoute, setInnerRoute] = useState(route);

  const containerRef = useRef<View>(null);
  const transitionSharedValue = useSharedValue(1);
  const transitionTo = useCallback(
    async (route: string) => {
      const snapshotId = containerRef.current
        ? await captureSnapshot(containerRef.current).catch(() => null)
        : null;
      setSnapshot(snapshotId);
      await waitTime(10);
      transitionSharedValue.value = 0;
      setInnerRoute(route);
      await waitTime(10);
      transitionSharedValue.value = withTiming(1, { duration: 300 }, () => {
        runOnJS(setSnapshot)(null);
      });
    },
    [transitionSharedValue],
  );

  useEffect(() => {
    if (innerRoute !== route) {
      transitionTo(route);
    }
  }, [innerRoute, route, transitionTo]);

  const snapshotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionSharedValue.value, [0, 1], [1, 0]),
  }));

  return (
    <View ref={containerRef} style={{ flex: 1 }} collapsable={false}>
      {routesMap[innerRoute]}
      {snapshot && (
        <Animated.View style={[StyleSheet.absoluteFill, snapshotStyle]}>
          <SnapshotRenderer
            snapshotID={snapshot}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default SnapshotFadeTransitionAnimator;
