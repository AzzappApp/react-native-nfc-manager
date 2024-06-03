import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { colors } from '#theme';
import type { ResizeHandlePosition } from './coverBoundsLayerEditorTypes';

type ResizeHandleProps = {
  active: boolean;
  handlePosition: ResizeHandlePosition;
  onAxisResizeStart: (position: ResizeHandlePosition) => void;
  onAxisResizeUpdate: (
    position: ResizeHandlePosition,
    translation: number,
  ) => void;
  onAxisResizeEnd: (position: ResizeHandlePosition) => void;
};

const RESIZE_HANDLE_SIZE = { width: 20, height: 36 };

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  active,
  handlePosition,
  onAxisResizeStart,
  onAxisResizeUpdate,
  onAxisResizeEnd,
}) => {
  const axis =
    handlePosition === 'left' || handlePosition === 'right' ? 'x' : 'y';
  const pan = Gesture.Pan()
    .enabled(active)
    .onStart(() => onAxisResizeStart(handlePosition))
    .onChange(e => {
      onAxisResizeUpdate(
        handlePosition,
        axis === 'x' ? e.translationX : e.translationY,
      );
    })
    .onEnd(() => onAxisResizeEnd(handlePosition));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.resizeHandle,
          styles[`resizeHandle_${axis}`],
          styles[`resizeHandle_${handlePosition}`],
        ]}
      />
    </GestureDetector>
  );
};

export default ResizeHandle;

const styles = StyleSheet.create({
  resizeHandle: {
    borderRadius: 6,
    borderWidth: RESIZE_HANDLE_SIZE.width / 2 - 1,
    borderColor: colors.red400,
    backgroundColor: colors.white,
    position: 'absolute',
  },
  resizeHandle_y: {
    width: RESIZE_HANDLE_SIZE.height,
    height: RESIZE_HANDLE_SIZE.width,
  },
  resizeHandle_x: {
    width: RESIZE_HANDLE_SIZE.width,
    height: RESIZE_HANDLE_SIZE.height,
  },
  resizeHandle_top: {
    top: -RESIZE_HANDLE_SIZE.width / 2,
    left: '50%',
    marginLeft: -RESIZE_HANDLE_SIZE.height / 2,
  },
  resizeHandle_bottom: {
    bottom: -RESIZE_HANDLE_SIZE.width / 2,
    left: '50%',
    marginLeft: -RESIZE_HANDLE_SIZE.height / 2,
  },
  resizeHandle_left: {
    left: -RESIZE_HANDLE_SIZE.width / 2,
    top: '50%',
    marginTop: -RESIZE_HANDLE_SIZE.height / 2,
  },
  resizeHandle_right: {
    right: -RESIZE_HANDLE_SIZE.width / 2,
    top: '50%',
    marginTop: -RESIZE_HANDLE_SIZE.height / 2,
  },
});
