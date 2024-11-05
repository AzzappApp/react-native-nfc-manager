import {
  Canvas,
  LinearGradient,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { Dimensions, StyleSheet, View } from 'react-native';
import type { Color } from '@shopify/react-native-skia';
import type { ParsedColorArray, SharedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('screen');

const WebCardBackground = ({
  colors,
}: {
  colors: Color[] | SharedValue<ParsedColorArray[] | string[]>;
}) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(width / 2, 0)}
            end={vec(width / 2, height * 0.66)}
            positions={[0.22, 0.66]}
            colors={colors}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width / 2, 0)}
            r={width * 1.3}
            colors={colors}
          />
        </Rect>
      </Canvas>
    </View>
  );
};

export default WebCardBackground;
