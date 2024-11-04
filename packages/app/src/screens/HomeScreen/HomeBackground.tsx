import { memo, useMemo } from 'react';
import {
  interpolateColor,
  useDerivedValue,
  convertToRGBA,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import WebCardBackground from '#components/WebCardBackground';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeBackground_user$key } from '#relayArtifacts/HomeBackground_user.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeBackgroundProps = {
  user: HomeBackground_user$key;
};

type HomeBackgroundComponentProps = {
  darkColors: string[];
  primaryColors: string[];
  currentIndexSharedValue: SharedValue<number>;
};

export const HomeBackgroundComponent = ({
  primaryColors,
  darkColors,
  currentIndexSharedValue,
}: HomeBackgroundComponentProps) => {
  const inputRange = useDerivedValue(
    () => Array.from({ length: primaryColors.length ?? 0 }, (_, i) => i),
    [primaryColors.length],
  );
  const skiaGradient = useDerivedValue(() => {
    if (primaryColors.length > 1) {
      return [
        convertToRGBA(
          interpolateColor(
            currentIndexSharedValue.value,
            inputRange.value,
            primaryColors,
          ),
        ),
        convertToRGBA(
          interpolateColor(
            currentIndexSharedValue.value,
            inputRange.value,
            darkColors,
          ),
        ),
      ];
    }
    if (primaryColors.length > 0) {
      return [primaryColors[0], darkColors[0]];
    }
    return ['#45444b', '#45444b'];
  });

  return <WebCardBackground colors={skiaGradient} />;
};

const HomeBackground = ({ user: userKey }: HomeBackgroundProps) => {
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

  const { currentIndexSharedValue } = useHomeScreenContext();

  const primaryColors = useMemo(
    () => [
      colors.black,
      ...(user.profiles ?? []).map(({ webCard }) => {
        if (webCard?.cardColors?.primary) {
          return webCard?.cardColors?.primary;
        }
        return '#45444b';
      }),
    ],
    [user],
  );

  const darkColors = useMemo(
    () => [
      colors.black,
      ...(user.profiles ?? []).map(
        ({ webCard }) => webCard?.cardColors?.dark ?? colors.black,
      ),
    ],
    [user],
  );

  return (
    <HomeBackgroundComponent
      primaryColors={primaryColors}
      darkColors={darkColors}
      currentIndexSharedValue={currentIndexSharedValue}
    />
  );
};

export default memo(HomeBackground);
