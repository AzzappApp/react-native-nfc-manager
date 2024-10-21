/* eslint-disable react-native/no-unused-styles */
import { PaintStyle, Skia } from '@shopify/react-native-skia';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type DerivedValue,
} from 'react-native-reanimated';

import { colors } from '#theme';
import { percentRectToRect } from '../coverEditorHelpers';
import type { SkCanvas, SkRect } from '@shopify/react-native-skia';
import type { ViewProps } from 'react-native';

export type ResizeHandlePosition = 'bottom' | 'left' | 'right' | 'top';

export type BoundsEditorGestureHandlerProps = ViewProps & {
  position: DerivedValue<{ bounds: SkRect; rotation: number } | null>;
  handles?: readonly ResizeHandlePosition[];
  onGestureStart: () => void;
  onRotate?: (angle: number) => void;
  onPinch?: (scale: number) => void;
  onPan: (x: number, y: number) => void;
  onResize?: (
    position: ResizeHandlePosition,
    deltaX: number,
    deltaY: number,
  ) => void;
  onGestureEnd: () => void;
};

const RESIZE_HANDLE_POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

const RESIZE_HANDLE_SIZE = { width: 36, height: 20 };
const RESIZE_HANDLE_RADIUS = 6;
const DEBUG = false;

export const BoundsEditorGestureHandler = ({
  position,
  handles = RESIZE_HANDLE_POSITIONS,
  onGestureStart,
  onRotate,
  onPinch,
  onPan,
  onResize,
  onGestureEnd,
  style,
  children,
  ...props
}: BoundsEditorGestureHandlerProps) => {
  const pan = Gesture.Pan()
    .averageTouches(true)
    .onBegin(onGestureStart)
    .onChange(e => {
      onPan(e.translationX, e.translationY);
    })
    .onEnd(onGestureEnd);

  const rotate = Gesture.Rotation()
    .onBegin(onGestureStart)
    .onChange(e => {
      onRotate?.(e.rotation);
    })
    .onEnd(onGestureEnd);

  const pinch = Gesture.Pinch()
    .onBegin(onGestureStart)
    .onChange(e => {
      onPinch?.(e.scale);
    })
    .onEnd(onGestureEnd);

  const animatedStyle = useAnimatedStyle(() => {
    const {
      bounds: { x, y, width, height },
      rotation,
    } = position.value ?? {
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      rotation: 0,
    };
    return {
      position: 'absolute',
      left: x - width / 2,
      top: y - height / 2,
      width,
      height,
      transform: [{ rotate: `${rotation}rad` }],
    };
  });

  const opacitySharedValue = useSharedValue(0);

  useAnimatedReaction(
    () => !!position.value,
    (hasPosition: boolean) => {
      opacitySharedValue.value = hasPosition
        ? withDelay(
            50,
            withTiming(1, {
              duration: 180,
            }),
          )
        : 0;
    },
  );

  const animatedOptionsStyle = useAnimatedStyle(() => {
    return {
      opacity: opacitySharedValue.value,
      flex: 1,
    };
  });

  return (
    <GestureDetector
      gesture={Gesture.Race(Gesture.Simultaneous(pinch, rotate), pan)}
    >
      <Animated.View
        style={[
          style,
          animatedStyle,
          { transformOrigin: 'center' },
          DEBUG && { backgroundColor: '#00FFFF33' },
        ]}
        {...props}
      >
        {onResize &&
          handles.map(position => (
            <ResizeHandleGestureHandler
              key={position}
              position={position}
              onGestureStart={onGestureStart}
              onResize={onResize}
              onGestureEnd={onGestureEnd}
            />
          ))}
        <Animated.View style={[animatedOptionsStyle, styles.innerContainer]}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const ResizeHandleGestureHandler = ({
  position,
  onGestureStart,
  onResize,
  onGestureEnd,
}: {
  position: ResizeHandlePosition;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onResize: (
    position: ResizeHandlePosition,
    deltaX: number,
    deltaY: number,
  ) => void;
}) => {
  const axis = position === 'left' || position === 'right' ? 'x' : 'y';
  const pan = Gesture.Pan()
    .onStart(onGestureStart)
    .onChange(e => {
      onResize(position, e.translationX, e.translationY);
    })
    .onEnd(onGestureEnd);

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[
          styles.resizeHandle,
          styles[`resizeHandle_${axis}`],
          styles[`resizeHandle_${position}`],
          DEBUG && { backgroundColor: '#FF000033' },
        ]}
      />
    </GestureDetector>
  );
};

const pixelRatio = PixelRatio.get();

const RESIZE_HANDLE_SIZE_WITH_HIT_SLOP = {
  width: RESIZE_HANDLE_SIZE.width * 3,
  height: RESIZE_HANDLE_SIZE.height * 2,
};
const styles = StyleSheet.create({
  resizeHandle: {
    position: 'absolute',
    zIndex: 1,
  },
  resizeHandle_y: {
    width: RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.width,
    height: RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.height,
  },
  resizeHandle_x: {
    width: RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.height,
    height: RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.width,
  },
  resizeHandle_top: {
    top: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.height / 2,
    left: '50%',
    marginLeft: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.width / 2,
  },
  resizeHandle_bottom: {
    bottom: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.height / 2,
    left: '50%',
    marginLeft: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.width / 2,
  },
  resizeHandle_left: {
    left: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.height / 2,
    top: '50%',
    marginTop: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.width / 2,
  },
  resizeHandle_right: {
    right: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.height / 2,
    top: '50%',
    marginTop: -RESIZE_HANDLE_SIZE_WITH_HIT_SLOP.width / 2,
  },
  innerContainer: {
    pointerEvents: 'box-none',
    zIndex: 2,
  },
});

const drawResizeHandles = (
  canvas: SkCanvas,
  layerWidth: number,
  layerHeight: number,
  position: 'bottom' | 'left' | 'right' | 'top',
) => {
  'worklet';

  const size = {
    width: RESIZE_HANDLE_SIZE.width * pixelRatio,
    height: RESIZE_HANDLE_SIZE.height * pixelRatio,
  };
  const x =
    position === 'left'
      ? -size.height / 2
      : position === 'right'
        ? layerWidth - size.height / 2
        : layerWidth / 2 - size.width / 2;
  const y =
    position === 'top'
      ? -size.height / 2
      : position === 'bottom'
        ? layerHeight - size.height / 2
        : layerHeight / 2 - size.width / 2;
  const paint = Skia.Paint();
  canvas.save();
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(colors.red400));
  canvas.translate(x, y);

  const radius = RESIZE_HANDLE_RADIUS * pixelRatio;
  canvas.drawRRect(
    {
      rx: radius,
      ry: radius,
      rect: {
        x: 0,
        y: 0,
        width:
          position === 'top' || position === 'bottom'
            ? size.width
            : size.height,
        height:
          position === 'top' || position === 'bottom'
            ? size.height
            : size.width,
      },
    },
    paint,
  );
  canvas.translate(size.height / 2 - pixelRatio, size.height / 2 - pixelRatio);
  paint.setColor(Skia.Color(colors.white));
  canvas.drawRRect(
    {
      rx: radius,
      ry: radius,
      rect: {
        x: 0,
        y: 0,
        width:
          position === 'top' || position === 'bottom'
            ? 16 * pixelRatio
            : 2 * pixelRatio,
        height:
          position === 'top' || position === 'bottom'
            ? 2 * pixelRatio
            : 16 * pixelRatio,
      },
    },
    paint,
  );
  canvas.restore();
};

export const drawBoundsEditor = ({
  canvas,
  width,
  height,
  bounds,
  rotation,
  drawHandles = true,
  handles = RESIZE_HANDLE_POSITIONS,
}: {
  canvas: SkCanvas;
  width: number;
  height: number;
  bounds: SkRect;
  rotation: number;
  drawHandles?: boolean;
  handles?: readonly ResizeHandlePosition[];
}) => {
  'worklet';
  const {
    x,
    y,
    width: layerWidth,
    height: layerHeight,
  } = percentRectToRect(bounds, width, height);
  canvas.save();
  canvas.translate(x - layerWidth / 2, y - layerHeight / 2);
  canvas.rotate((rotation * 180) / Math.PI, layerWidth / 2, layerHeight / 2);
  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(pixelRatio);
  paint.setColor(Skia.Color(colors.red400));
  canvas.drawRect(
    { x: 0, y: 0, width: layerWidth, height: layerHeight },
    paint,
  );

  if (drawHandles) {
    handles.forEach(position =>
      drawResizeHandles(canvas, layerWidth, layerHeight, position),
    );
  }

  canvas.restore();
};
