import {
  Canvas,
  RadialGradient,
  Rect,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';
import _ from 'lodash';
import { useMemo } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import {
  interpolateColor,
  useDerivedValue,
  convertToRGBA,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import type { HomeBackground_user$key } from '#relayArtifacts/HomeBackground_user.graphql';
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

  const user = useFragment(
    graphql`
      fragment HomeBackground_user on User {
        profiles {
          webCard {
            id
            cardColors {
              dark
              primary
            }
          }
        }
      }
    `,
    userKey,
  );

  const inputRange = _.range(0, user.profiles?.length);

  const primaryColors = useMemo(
    () =>
      (user.profiles ?? []).map(({ webCard }) => {
        if (webCard.cardColors?.primary) {
          return webCard.cardColors?.primary;
        }
        return '#45444b';
      }),
    [user],
  );

  const darkColors = useMemo(
    () =>
      (user.profiles ?? []).map(
        ({ webCard }) => webCard.cardColors?.dark ?? colors.black,
      ),
    [user],
  );

  const skiaGradient = useDerivedValue(() => {
    if (primaryColors.length > 1) {
      return [
        convertToRGBA(
          interpolateColor(
            currentProfileIndexSharedValue.value,
            inputRange,
            primaryColors,
          ),
        ),
        convertToRGBA(
          interpolateColor(
            currentProfileIndexSharedValue.value,
            inputRange,
            darkColors,
          ),
        ),
      ];
    }
    if (primaryColors.length > 0) {
      return [primaryColors[0], darkColors[0]];
    }
    return ['#45444b', '#45444b'];
  }, [inputRange, primaryColors, darkColors]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width / 2, 0)}
            r={width * 1.3}
            colors={skiaGradient}
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
