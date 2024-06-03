import { clamp, Matrix4 } from '@shopify/react-native-skia';
import { useCallback, useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { percentRectToRect } from '../coverEditorHelpers';
import LayerEditorControls from './LayerEditorControls';
import type {
  ResizeAxis,
  ResizeHandlePosition,
} from './coverBoundsLayerEditorTypes';
import type { SkRect, SkSize } from '@shopify/react-native-skia';

type CoverLayerBoundsEditorProps = {
  canvasSize: SkSize;
  bounds: SkRect;
  rotation: number;
  active: boolean;
  controlsPosition: 'right' | 'top';
  resizeAxis: ResizeAxis[];
  hideControls?: boolean;
  onTap: () => void;
  overrideScaleUpdateWorklet?: (
    offsetBounds: SkRect,
    scale: number,
  ) => SkRect | null | undefined;
  transformBoundsAfterResizeWorklet?: (bounds: SkRect) => SkRect;
  onUpdateProgressWorklet?: (bounds: SkRect, rotation: number) => void;
  onUpdateEnd: (bounds: SkRect, rotation: number) => void;
  onCrop?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
};

export const CoverLayerBoundsEditor = ({
  canvasSize,
  bounds,
  rotation,
  active,
  controlsPosition,
  resizeAxis,
  hideControls = false,
  transformBoundsAfterResizeWorklet,
  overrideScaleUpdateWorklet,
  onTap,
  onUpdateProgressWorklet,
  onUpdateEnd,
  onCrop,
  onEdit,
  onDelete,
}: CoverLayerBoundsEditorProps) => {
  const boundsSharedValue = useSharedValue(bounds);
  useEffect(() => {
    boundsSharedValue.value = bounds;
  }, [bounds, boundsSharedValue]);

  const rotationSharedValue = useSharedValue(rotation ?? Matrix4());
  useEffect(() => {
    rotationSharedValue.value = rotation ?? Matrix4();
  }, [rotation, rotationSharedValue]);

  const gestureOffset = useSharedValue({
    bounds: boundsSharedValue.value,
    transformMatrix: rotationSharedValue.value,
  });

  const onBegin = useCallback(() => {
    'worklet';
    gestureOffset.value = {
      bounds: boundsSharedValue.value,
      transformMatrix: rotationSharedValue.value,
    };
  }, [gestureOffset, boundsSharedValue, rotationSharedValue]);

  const onEnd = useCallback(() => {
    'worklet';
    const bounds = { ...boundsSharedValue.value };
    const rotation = rotationSharedValue.value;
    runOnJS(onUpdateEnd)(bounds, rotation);
  }, [boundsSharedValue.value, onUpdateEnd, rotationSharedValue.value]);

  const tap = Gesture.Tap()
    .enabled(!active)
    .onEnd(() => {
      runOnJS(onTap)();
    });

  const pan = Gesture.Pan()
    .enabled(active)
    .averageTouches(true)
    .onBegin(onBegin)
    .onChange(e => {
      const {
        bounds: { x, y, width, height },
      } = gestureOffset.value;

      boundsSharedValue.value = {
        ...boundsSharedValue.value,
        x: clamp(x + e.translationX / canvasSize.width, 0, 1 - width),
        y: clamp(y + e.translationY / canvasSize.height, 0, 1 - height),
      };
      onUpdateProgressWorklet?.(
        boundsSharedValue.value,
        rotationSharedValue.value,
      );
      if (transformBoundsAfterResizeWorklet) {
        boundsSharedValue.value = transformBoundsAfterResizeWorklet(
          boundsSharedValue.value,
        );
      }
    })
    .onEnd(onEnd);

  const rotate = Gesture.Rotation()
    .enabled(active)
    .onBegin(onBegin)
    .onChange(e => {
      rotationSharedValue.value = e.rotation;
      onUpdateProgressWorklet?.(
        boundsSharedValue.value,
        rotationSharedValue.value,
      );
    })
    .onEnd(onEnd);

  const pinch = Gesture.Pinch()
    .enabled(active)
    .onBegin(onBegin)
    .onChange(e => {
      if (overrideScaleUpdateWorklet) {
        const newBounds = overrideScaleUpdateWorklet(
          gestureOffset.value.bounds,
          e.scale,
        );
        if (newBounds) {
          boundsSharedValue.value = newBounds;
        }
        return;
      }
      const { x, y, width, height } = gestureOffset.value.bounds;
      const scale = e.scale;
      const scaledWidth = clamp(width * scale, 0.2, 1);
      const scaledHeight = clamp(height * scale, 0.2, 1);
      boundsSharedValue.value = {
        x: x - (scaledWidth - width) / 2,
        y: y - (scaledHeight - height) / 2,
        width: scaledWidth,
        height: scaledHeight,
      };
      onUpdateProgressWorklet?.(
        boundsSharedValue.value,
        rotationSharedValue.value,
      );
    })
    .onEnd(onEnd);

  const onAxisResizeUpdate = useCallback(
    (position: ResizeHandlePosition, value: number) => {
      'worklet';
      const { x, y, width, height } = gestureOffset.value.bounds;
      value =
        position === 'top' || position === 'bottom'
          ? value / canvasSize.height
          : value / canvasSize.width;

      switch (position) {
        case 'top': {
          value = clamp(value, -y, height - 0.2);
          boundsSharedValue.value = {
            x,
            y: y + value,
            width,
            height: height - value,
          };
          break;
        }
        case 'bottom':
          value = clamp(value, 0.2 - height, 1 - y - height);
          boundsSharedValue.value = {
            x,
            y,
            width,
            height: height + value,
          };
          break;
        case 'left':
          value = clamp(value, -x, width - 0.2);
          boundsSharedValue.value = {
            x: x + value,
            y,
            width: width - value,
            height,
          };
          break;
        case 'right':
          value = clamp(value, 0.2 - width, 1 - x - width);
          boundsSharedValue.value = {
            x,
            y,
            width: width + value,
            height,
          };
          break;
      }
      onUpdateProgressWorklet?.(
        boundsSharedValue.value,
        rotationSharedValue.value,
      );
      if (transformBoundsAfterResizeWorklet) {
        boundsSharedValue.value = transformBoundsAfterResizeWorklet(
          boundsSharedValue.value,
        );
      }
    },
    [
      gestureOffset.value.bounds,
      canvasSize.height,
      canvasSize.width,
      onUpdateProgressWorklet,
      boundsSharedValue,
      rotationSharedValue.value,
      transformBoundsAfterResizeWorklet,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const { x, y, width, height } = percentRectToRect(
      boundsSharedValue.value,
      canvasSize.width,
      canvasSize.height,
    );
    return {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      transform: [{ rotate: `${rotationSharedValue.value}rad` }],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(tap, pinch, rotate, pan)}>
      <Animated.View
        style={[
          animatedStyle,
          {
            transformOrigin: 'center',
          },
        ]}
      >
        {active ? (
          <LayerEditorControls
            bounds={boundsSharedValue}
            rotation={rotationSharedValue}
            canvasSize={canvasSize}
            resizeAxis={resizeAxis}
            active={active}
            hideControls={hideControls}
            onAxisResizeStart={onBegin}
            onAxisResizeUpdate={onAxisResizeUpdate}
            onAxisResizeEnd={onEnd}
            controlsPosition={controlsPosition}
            onCrop={onCrop}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};
