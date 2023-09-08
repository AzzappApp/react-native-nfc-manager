import chroma from 'chroma-js';
import { LinearGradient } from 'expo-linear-gradient';
import clamp from 'lodash/clamp';
import { useCallback, useRef, useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import type {
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';

type HuePickerProps = {
  value: number;
  onChange(value: number): void;
  style?: StyleProp<ViewStyle>;
};

const HuePicker = ({ value, onChange, style }: HuePickerProps) => {
  const [width, setWidth] = useState<number | null>(null);

  const widthRef = useRef(width);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setWidth(width);
    widthRef.current = width;
  };

  const handleGestureEvent = useCallback((event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    if (!widthRef.current) {
      return null;
    }
    onChangeRef.current(clamp(locationX / widthRef.current, 0, 1) * 360);
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: handleGestureEvent,
      onPanResponderMove: handleGestureEvent,
      onPanResponderRelease: handleGestureEvent,
      onPanResponderTerminate: handleGestureEvent,
    }),
  ).current;

  let { borderRadius } = StyleSheet.flatten(style);

  borderRadius ??= 0;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <LinearGradient
        style={[styles.innerGradient, { borderRadius }]}
        colors={HUE_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        {...pan.panHandlers}
        hitSlop={{ left: 8, right: 8, top: 10, bottom: 10 }}
      />
      {width && (
        <View
          style={[
            styles.slider,
            {
              backgroundColor: chroma.hsl(value, 1, 0.5).hex(),
              transform: [{ translateX: (value / 360) * width }],
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

export default HuePicker;

const HUE_COLORS = [
  '#ff0000',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#ff00ff',
  '#ff0000',
];

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    height: 8,
  },
  innerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  slider: {
    width: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 2,
    top: -4,
    left: -8,
    position: 'absolute',
    borderColor: '#fff',
  },
});
