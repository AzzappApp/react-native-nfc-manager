import { clamp, type Matrix4 } from '@shopify/react-native-skia';

import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';

import { ScaleFactor } from './LayerEditorHelper';
import type { ResizeAxis, ReziseHandlePosition, WorkspaceLimits } from './type';
import type { SharedValue } from 'react-native-reanimated';

type ResizeHandleProps = {
  matrix: SharedValue<Matrix4>;
  handlePosition: ReziseHandlePosition;
  axis: ResizeAxis;
  limits: WorkspaceLimits;
  workspace: { width: SharedValue<number>; height: SharedValue<number> };
  onResize?: (axis: ResizeAxis, value: number) => void;
};

const ResizeHandleSize = { width: 20, height: 36 };
const BORDER_WIDTH = 2;
const DEFAULT_MIN_SIZE = 50;

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  matrix,
  axis,
  workspace,
  handlePosition,
  limits,
  onResize,
}) => {
  const lastTranslation = useSharedValue({ x: 0, y: 0 });

  const pan = Gesture.Pan()
    .onStart(event => {
      lastTranslation.value = { x: event.translationX, y: event.translationY };
    })
    .onChange(event => {
      const translation = {
        x: event.translationX - lastTranslation.value.x,
        y: event.translationY - lastTranslation.value.y,
      };

      lastTranslation.value = { x: event.translationX, y: event.translationY };

      if (axis === 'x') {
        if (handlePosition === 'left') {
          workspace.width.value = clamp(
            workspace.width.value - translation.x,
            DEFAULT_MIN_SIZE,
            limits.width - matrix.value[3],
          );
        } else {
          workspace.width.value = clamp(
            workspace.width.value + translation.x,
            DEFAULT_MIN_SIZE,
            limits.width - matrix.value[3],
          );
        }
        if (onResize) {
          runOnJS(onResize)('x', workspace.width.value);
        }
      } else {
        if (handlePosition === 'top') {
          workspace.height.value = clamp(
            workspace.height.value - translation.y,
            DEFAULT_MIN_SIZE,
            limits.height - matrix.value[7],
          );
        } else {
          workspace.height.value = clamp(
            workspace.height.value + translation.y,
            DEFAULT_MIN_SIZE,
            limits.height - matrix.value[7],
          );
        }

        if (onResize) {
          runOnJS(onResize)('y', workspace.height.value);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const factor = ScaleFactor(matrix);

    let newTop: number = 0;
    let newLeft: number = 0;

    if (axis === 'x') {
      if (handlePosition === 'left') {
        newTop =
          workspace.height.value / 2 -
          ResizeHandleSize.height / 2 -
          BORDER_WIDTH / 2;
        newLeft = -ResizeHandleSize.width / 2 - BORDER_WIDTH / 2;
      } else {
        newTop =
          workspace.height.value / 2 -
          ResizeHandleSize.height / 2 -
          BORDER_WIDTH / 2;
        newLeft =
          workspace.width.value - ResizeHandleSize.width / 2 - BORDER_WIDTH - 1;
      }
    } else if (axis === 'y') {
      if (handlePosition === 'top') {
        newTop = 0 - ResizeHandleSize.width / 2 - BORDER_WIDTH / 2;
        newLeft = workspace.width.value / 2 - ResizeHandleSize.height / 2;
      } else {
        newTop =
          workspace.height.value -
          ResizeHandleSize.width / 2 -
          BORDER_WIDTH -
          1;
        newLeft = workspace.width.value / 2 - ResizeHandleSize.height / 2;
      }
    }

    return {
      width: axis === 'x' ? ResizeHandleSize.width : ResizeHandleSize.height,
      height: axis === 'y' ? ResizeHandleSize.width : ResizeHandleSize.height,
      backgroundColor: colors.white,
      position: 'absolute',
      top: newTop,
      left: newLeft,
      borderRadius: 6,
      borderWidth: ResizeHandleSize.width / 2 - 1,
      borderColor: colors.red400,
      transform: [{ scale: Math.min(factor, 1) }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle} />
    </GestureDetector>
  );
};

export default ResizeHandle;
