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

  const { currentIndexSharedValue, inputRange } = useHomeScreenContext();

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

export default memo(HomeBackground);
