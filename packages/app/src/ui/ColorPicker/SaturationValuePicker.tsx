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

type SaturationValuePickerProps = {
  hue: number;
  value: [saturation: number, value: number];
  onChange(value: [saturation: number, value: number]): void;
  style?: StyleProp<ViewStyle>;
};

const SaturationValuePicker = ({
  hue,
  value: [saturation, value],
  onChange,
  style,
}: SaturationValuePickerProps) => {
  const [size, setSize] = useState<[width: number, height: number] | null>(
    null,
  );

  const sizeRef = useRef(size);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize([width, height]);
    sizeRef.current = [width, height];
  };

  const handleGestureEvent = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    if (!sizeRef.current) {
      return null;
    }
    const [width, height] = sizeRef.current;
    onChangeRef.current([
      clamp(locationX / width, 0, 1),
      clamp(1 - locationY / height, 0, 1),
    ]);
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
        colors={['#fff', chroma.hsl(hue, 1, 0.5).hex()]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        {...pan.panHandlers}
        hitSlop={{ left: 12, right: 12, top: 12, bottom: 12 }}
      >
        <LinearGradient
          style={[styles.innerGradient, { borderRadius }]}
          colors={['rgba(0, 0, 0, 0)', '#000']}
        />
      </LinearGradient>
      {size && (
        <View
          style={[
            styles.slider,
            {
              backgroundColor: chroma.hsv(hue, saturation, value).hex(),
              borderColor: chroma.hsv(hue, 0, 1 - (value - saturation)).hex(),
              transform: [
                { translateX: size[0] * saturation },
                { translateY: size[1] * (1 - value) },
              ],
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

export default SaturationValuePicker;

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    height: 64,
  },
  innerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  slider: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    top: -12,
    left: -12,
    position: 'absolute',
    borderColor: '#fff',
  },
});
