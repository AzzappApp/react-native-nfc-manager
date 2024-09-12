import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeHeader_user$key } from '#relayArtifacts/HomeHeader_user.graphql';
import type { ColorValue } from 'react-native';

type HomeHeaderProps = {
  openPanel: () => void;
  user: HomeHeader_user$key;
};

const HomeHeader = ({ openPanel, user: userKey }: HomeHeaderProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeHeader_user on User {
        profiles {
          webCard {
            id
            cardColors {
              primary
            }
            isPremium
          }
        }
      }
    `,
    userKey,
  );

  const { currentIndexSharedValue, currentIndexProfile, inputRange } =
    useHomeScreenContext();
  const readableColors = useMemo(
    () => [
      colors.white,
      ...(profiles?.map(profile => {
        return profile?.webCard?.cardColors?.primary
          ? getTextColor(profile?.webCard.cardColors?.primary)
          : colors.white;
      }) ?? []),
    ],
    [profiles],
  );
  const colorValue = useDerivedValue<ColorValue>(() => {
    const currentProfileIndex = currentIndexSharedValue.value;
    if (inputRange.value.length > 1) {
      return interpolateColor(
        currentProfileIndex,
        inputRange.value,
        readableColors,
      );
    }
    if (readableColors.length > 0) {
      return readableColors[0];
    }
    return colors.white;
  }, [readableColors]);

  const svgProps = useAnimatedProps(() => ({ color: colorValue.value }));

  const iconStyles = useAnimatedStyle(() => ({
    tintColor: colorValue.value,
  }));

  const [currentWebCard, setCurrentWebCard] = useState(
    profiles?.[currentIndexProfile.value - 1]?.webCard,
  );
  useAnimatedReaction(
    () => currentIndexProfile.value,
    index => {
      const cProfile = profiles?.[index - 1];
      runOnJS(setCurrentWebCard)(cProfile?.webCard);
    },
  );

  return (
    <Header
      middleElement={
        <>
          <PremiumIndicator
            isRequired={currentWebCard?.isPremium}
            size={18}
            style={[styles.premiumIndicator, iconStyles]}
          />
          <AnimatedSvg
            width={136}
            height={28}
            viewBox="0 0 136 28"
            animatedProps={svgProps}
          >
            <Path
              fill="currentColor"
              d="M14.343 25.2c.488 0 .97-.032 1.441-.094 1.597-.21 3.31.325 4.108 1.724A13.664 13.664 0 0114.343 28C6.698 28 .5 21.732.5 14S6.698 0 14.343 0s13.843 6.268 13.843 14a14.03 14.03 0 01-5.882 11.455l-7.87-13.78-2.14 3.749A5.506 5.506 0 017.512 18.2l6.922-12.125 8.535 14.95A11.232 11.232 0 0025.417 14c0-6.186-4.958-11.2-11.074-11.2S3.269 7.814 3.269 14c0 6.186 4.958 11.2 11.074 11.2zM102.262 24.37c.377-.2.612-.593.612-1.02v-4.469a8.073 8.073 0 005.831 2.478c4.454 0 8.029-3.544 8.029-7.894S113.159 5.6 108.705 5.6c-4.424 0-7.999 3.515-7.999 7.865V25.2l1.556-.83zm.612-10.905c0-3.169 2.608-5.733 5.831-5.733 3.253 0 5.86 2.564 5.86 5.733 0 3.17-2.607 5.762-5.86 5.762-3.223 0-5.831-2.593-5.831-5.762zM42.86 5.6c4.424 0 7.998 3.515 7.998 7.866v7.75l-1.555-.83a1.156 1.156 0 01-.613-1.02v-.484a8.072 8.072 0 01-5.83 2.477c-4.425 0-8.03-3.543-8.03-7.894 0-4.35 3.605-7.865 8.03-7.865zm-5.861 7.866c0 3.169 2.637 5.762 5.86 5.762 3.223 0 5.831-2.593 5.831-5.763 0-3.169-2.608-5.733-5.83-5.733-3.224 0-5.861 2.564-5.861 5.734zM67.191 5.744H52.795l.83 1.527a1.16 1.16 0 001.019.605h8.449L52.795 21.215h14.396l-.83-1.527a1.16 1.16 0 00-1.019-.605H57.06l10.131-13.34zm1.83 0h14.396L73.286 19.083h8.282c.425 0 .816.232 1.019.605l.83 1.527H69.02l10.298-13.34h-8.45a1.16 1.16 0 01-1.018-.604l-.83-1.527z"
            />
            <Path
              fill="currentColor"
              d="M90.968 5.6c4.425 0 8 3.515 8 7.866v7.75l-1.556-.83a1.156 1.156 0 01-.613-1.02v-.484a8.072 8.072 0 01-5.83 2.477c-4.425 0-8.03-3.543-8.03-7.894 0-4.35 3.605-7.865 8.03-7.865zm-5.86 7.866c0 3.169 2.637 5.762 5.86 5.762 3.223 0 5.831-2.593 5.831-5.763 0-3.169-2.608-5.733-5.83-5.733-3.224 0-5.86 2.564-5.86 5.734zm35.533 9.884c0 .427-.236.82-.613 1.02l-1.556.83V13.465c0-4.35 3.575-7.865 7.999-7.865 4.454 0 8.029 3.515 8.029 7.865s-3.575 7.894-8.029 7.894a8.07 8.07 0 01-5.83-2.478v4.47zm5.83-15.618c-3.223 0-5.83 2.564-5.83 5.733 0 3.17 2.607 5.762 5.83 5.762 3.253 0 5.861-2.593 5.861-5.762 0-3.169-2.608-5.733-5.861-5.733z"
            />
          </AnimatedSvg>
        </>
      }
      rightElement={
        <View style={styles.rightButtonContainer}>
          <IconButton
            icon="menu"
            iconSize={26}
            size={45}
            variant="icon"
            iconStyle={iconStyles}
            onPress={openPanel}
          />
        </View>
      }
      style={styles.header}
    />
  );
};

export default HomeHeader;
export const HOME_HEADER_HEIGHT = 28;

const styles = StyleSheet.create({
  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  header: {
    backgroundColor: 'transparent',
    height: HOME_HEADER_HEIGHT,
  },
  premiumIndicator: {
    position: 'absolute',
    right: -20,
    top: -10,
  },
});

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
