import {
  Matrix4,
  multiply4,
  rotateZ,
  scale,
  translate,
  convertToColumnMajor,
  Skia,
  vec,
  clamp,
} from '@shopify/react-native-skia';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

import LayerEditorControls from './LayerEditorControls';
import type {
  CustomDimensionsType,
  ResizeAxis,
  ResizeHandleAxis,
} from './type';

import type { SharedValue } from 'react-native-reanimated';

type GestureHandlerProps = {
  limits: { width: number; height: number };
  matrix: SharedValue<Matrix4>;
  dimensions: CustomDimensionsType;
  isSelected: boolean;
  workspace: { width: SharedValue<number>; height: SharedValue<number> };
  resizeAxis: ResizeHandleAxis;
  onSelect: () => void;
  onResize?: (axis: ResizeAxis, value: number) => void;
  onCrop?: () => void;
  onDelete?: () => void;
  onRotation?: () => void;
  onScale?: () => void;
  onDrag?: () => void;
};

export const GestureHandler = ({
  limits,
  matrix,
  dimensions,
  isSelected,
  workspace,
  resizeAxis,
  onSelect,
  onResize,
  onCrop,
  onDelete,
  onRotation,
  onScale,
  onDrag,
}: GestureHandlerProps) => {
  const { x, y } = dimensions;
  const origin = useSharedValue(Skia.Point(0, 0));
  const offset = useSharedValue(Matrix4());

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onBegin(_ => {
      return runOnJS(onSelect)();
    })
    .onChange(e => {
      const currentY = matrix.value[7];
      const currentX = matrix.value[3];

      const potentialNewX = currentX + e.changeX;
      const potentialNewY = currentY + e.changeY;

      const clampedX = clamp(
        potentialNewX,
        0,
        limits.width - workspace.width.value,
      );
      const clampedY = clamp(
        potentialNewY,
        0,
        limits.height - workspace.height.value,
      );

      matrix.value = multiply4(
        translate(clampedX - currentX, clampedY - currentY),
        matrix.value,
      );
    })
    .onEnd(() => {
      if (onDrag) {
        // TODO: Update the onDrag method according to the real case
        runOnJS(onDrag)();
      }
    });

  const rotate = Gesture.Rotation()
    .onBegin(_ => {
      offset.value = matrix.value;
    })
    .onChange(e => {
      matrix.value = multiply4(
        offset.value,
        rotateZ(
          e.rotation,
          Skia.Point(workspace.width.value / 2, workspace.height.value / 2),
        ),
      );
    })
    .onEnd(() => {
      if (onRotation) {
        // TODO: Update the onRotation method according to the real case
        runOnJS(onRotation)();
      }
    });

  const pinch = Gesture.Pinch()
    .onBegin(e => {
      origin.value = vec(e.focalX, e.focalY);
      offset.value = matrix.value;
    })
    .onChange(e => {
      matrix.value = multiply4(
        offset.value,
        scale(e.scale, e.scale, 1, origin.value),
      );
    })
    .onEnd(() => {
      if (onScale) {
        // TODO: Update the onScale method according to the real case
        runOnJS(onScale)();
      }
    });

  const style = useAnimatedStyle(() => {
    const m4 = convertToColumnMajor(matrix.value);

    return {
      position: 'absolute',
      left: x,
      top: y,
      width: workspace.width.value,
      height: workspace.height.value,
      transform: [
        { translateX: -workspace.width.value / 2 },
        { translateY: -workspace.height.value / 2 },
        {
          matrix: m4 as unknown as number[],
        },
        { translateX: workspace.width.value / 2 },
        { translateY: workspace.height.value / 2 },
      ],
    };
  });

  const composed = Gesture.Simultaneous(pinch, rotate, pan);
  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={style}>
        {isSelected ? (
          <LayerEditorControls
            resize
            matrix={matrix}
            limits={limits}
            workspace={workspace}
            resizeAxis={resizeAxis}
            isActivated={isSelected}
            onResize={onResize}
            onCrop={onCrop}
            onDelete={onDelete}
          />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};
