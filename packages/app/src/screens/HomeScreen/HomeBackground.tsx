import { memo, useMemo } from 'react';
import { interpolateColor } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import WebCardBackground from '#components/WebCardBackground';
import { useIndexInterpolation } from './homeHelpers';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeBackground_user$key } from '#relayArtifacts/HomeBackground_user.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeBackgroundProps = {
  user: HomeBackground_user$key;
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

  const gradientColors = useMemo(
    () => [
      ['#45444b', colors.black],
      ...(user.profiles ?? []).map(({ webCard }) => [
        webCard?.cardColors?.primary ?? '#45444b',
        webCard?.cardColors?.dark ?? colors.black,
      ]),
    ],
    [user],
  );

  return (
    <HomeBackgroundComponent
      gradientColors={gradientColors}
      currentIndexSharedValue={currentIndexSharedValue}
    />
  );
};

export default memo(HomeBackground);

type HomeBackgroundComponentProps = {
  gradientColors: string[][];
  currentIndexSharedValue: SharedValue<number>;
};

export const HomeBackgroundComponent = ({
  gradientColors,
  currentIndexSharedValue,
}: HomeBackgroundComponentProps) => {
  const skiaGradient = useIndexInterpolation(
    currentIndexSharedValue,
    gradientColors,
    ['#45444b', colors.black],
    (value, inputRange, outputRange) => {
      'worklet';
      return [
        interpolateColor(
          value,
          inputRange,
          outputRange.map(c => c[0] ?? '#45444b'),
        ),
        interpolateColor(
          value,
          inputRange,
          outputRange.map(c => c[1] ?? colors.black),
        ),
      ];
    },
  );

  return <WebCardBackground colors={skiaGradient} />;
};
