import chroma from 'chroma-js';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { clamp, runOnJS } from 'react-native-reanimated';
import type { StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';

type HuePickerProps = {
  value: number;
  onChange(value: number): void;
  style?: StyleProp<ViewStyle>;
};

const HuePicker = ({ value, onChange, style }: HuePickerProps) => {
  const [width, setWidth] = useState<number | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setWidth(width);
  };

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(e => {
          const { x } = e;
          if (!width) {
            return null;
          }

          runOnJS(onChange)(clamp(x / width, 0, 1) * 360);
        })
        .onChange(e => {
          const { x } = e;
          if (!width) {
            return null;
          }

          runOnJS(onChange)(clamp(x / width, 0, 1) * 360);
        }),
    [onChange, width],
  );

  let { borderRadius } = StyleSheet.flatten(style);

  borderRadius ??= 0;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <GestureDetector gesture={panGesture}>
        <LinearGradient
          style={[styles.innerGradient, { borderRadius }]}
          colors={HUE_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          hitSlop={{ left: 8, right: 8, top: 10, bottom: 10 }}
        />
      </GestureDetector>
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
] as const;

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
