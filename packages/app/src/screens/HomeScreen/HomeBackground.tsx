import _ from 'lodash';
import { useMemo } from 'react';
import {
  interpolateColor,
  useDerivedValue,
  convertToRGBA,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import WebCardBackground from '#components/WebCardBackground';
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

  return <WebCardBackground colors={skiaGradient} />;
};

export default HomeBackground;
