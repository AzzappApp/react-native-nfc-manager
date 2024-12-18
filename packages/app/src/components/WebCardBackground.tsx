import {
  Canvas,
  LinearGradient,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import useScreenDimensions from '#hooks/useScreenDimensions';
import type { Color } from '@shopify/react-native-skia';
import type { DerivedValue, ParsedColorArray } from 'react-native-reanimated';

const WebCardBackground = ({
  colors,
}: {
  colors:
    | Color[]
    | DerivedValue<ParsedColorArray[] | string[]>
    | DerivedValue<string[]>;
}) => {
  const { width, height } = useScreenDimensions();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }} opaque>
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
