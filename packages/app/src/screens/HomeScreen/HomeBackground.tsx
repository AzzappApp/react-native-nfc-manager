import {
  Canvas,
  RadialGradient,
  Rect,
  vec,
  useValue,
  LinearGradient,
  useComputedValue,
  interpolateColors,
  useSharedValueEffect,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import type { HomeBackground_user$key } from '@azzapp/relay/artifacts/HomeBackground_user.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeBackgroundProps = {
  user: HomeBackground_user$key;
  currentProfileIndexSharedValue: SharedValue<number>;
};

const HomeBackground = ({
  user: userKey,
  currentProfileIndexSharedValue,
}: HomeBackgroundProps) => {
  const { width, height } = useWindowDimensions();
  const { profiles } = useFragment(
    graphql`
      fragment HomeBackground_user on User {
        profiles {
          id
          cardColors {
            primary
            dark
          }
        }
      }
    `,
    userKey,
  );

  const skiaFirstColor = useValue(0);
  const skiaSecondColor = useValue(0);

  const profilesColors = useMemo(
    () =>
      profiles?.map(profile => ({
        primary: profile.cardColors?.primary ?? '#45444b',
        dark: profile.cardColors?.dark ?? colors.black,
      })) ?? [],
    [profiles],
  );

  useSharedValueEffect(() => {
    const currentProfileIndex = currentProfileIndexSharedValue.value;
    const prev = Math.floor(currentProfileIndexSharedValue.value);
    const next = Math.ceil(currentProfileIndexSharedValue.value);

    //@ts-expect-error interpolateColors is typed as returning a `number[]`, but the value is correct
    skiaFirstColor.current = interpolateColors(
      currentProfileIndex,
      [prev, next],
      [
        profilesColors[prev]?.primary ?? '#45444b',
        profilesColors[next]?.primary ?? '#45444b',
      ],
    );

    //@ts-expect-error interpolateColors is typed as returning a `number[]`, but the value is correct
    skiaSecondColor.current = interpolateColors(
      currentProfileIndex,
      [prev, next],
      [
        profilesColors[prev]?.dark ?? '#45444b',
        profilesColors[next]?.dark ?? '#45444b',
      ],
    );
  }, currentProfileIndexSharedValue);

  const radiantColor = useComputedValue(() => {
    return [skiaFirstColor.current, skiaSecondColor.current];
  }, [skiaFirstColor, skiaSecondColor]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width / 2, 0)}
            r={width * 1.3}
            colors={radiantColor}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(width / 2, 0)}
            end={vec(width / 2, height * 0.66)}
            positions={[0.22, 0.66]}
            colors={['rgba(0, 0, 0,0)', 'rgba(0, 0, 0,0.2)']}
          />
        </Rect>
      </Canvas>
    </View>
  );
};

export default HomeBackground;

// NOT ANIMATED RADIAL VERSION USING SVG AND NOT SKIA (not possible to anim due to Stop component)
//     https://github.com/software-mansion/react-native-reanimated/issues/1938
//     The SVG.Stop is something like a dummy component and they don't have native tag and there is no possibility to animate them at this moment.
//      <Svg height={height} width={width}>
//       <Defs>
//         <RadialGradientSVG
//           id="grad"
//           cx={0.5}
//           cy={0.0}
//           rx={1.3}
//           ry={0.66}
//           gradientUnits="objectBoundingBox"
//         >
//           <Stop offset="0%" stopColor="blue" stopOpacity="1" />
//           <Stop offset="100%" stopColor="#yellow" stopOpacity="1" />
//         </RadialGradientSVG>
//         {/* <LinearGradient
//           id="linear"
//           x1={0.5}
//           y1={0}
//           x2={0.5}
//           y2={0.66}
//           gradientUnits="objectBoundingBox"
//         >
//           <Stop offset={0.22} stopColor="rgb(0, 0, 0)" stopOpacity={0} />
//           <Stop offset={0.66} stopColor="rgb(0, 0, 0)" stopOpacity={0.2} />
//         </LinearGradient> */}
//       </Defs>
//       <RectSVG x="0" y="0" height={height} width={width} fill="url(#grad)" />
//       <Rect x="0" y="0" height={height} width={width} fill="url(#linear)" />
//        </Svg>
