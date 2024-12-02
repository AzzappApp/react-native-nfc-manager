import {
  Canvas,
  ImageSVG,
  Mask,
  Rect,
  useSVG,
} from '@shopify/react-native-skia';
import concat from 'lodash/concat';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import { useIndexInterpolation } from './homeHelpers';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeHeader_user$key } from '#relayArtifacts/HomeHeader_user.graphql';
import type { DerivedValue } from 'react-native-reanimated';

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

  const { currentIndexSharedValue } = useHomeScreenContext();

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

  const color = useIndexInterpolation<string>(
    currentIndexSharedValue,
    readableColors,
    colors.white,
    interpolateColor,
  );

  const iconStyles = useAnimatedStyle(() => ({
    tintColor: color.value,
  }));

  const isPremium = useIndexInterpolation(
    currentIndexSharedValue,
    concat(
      0,
      profiles?.map(profile => (profile?.webCard?.isPremium ? 1 : 0)) ?? [],
    ),
    0,
  );

  return (
    <Header
      middleElement={
        <AnimatedHomeHeaderCentralComponent
          isPremium={isPremium}
          color={color}
        />
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

export default memo(HomeHeader);

export const HOME_HEADER_HEIGHT = 28;

type AnimatedHomeHeaderCentralComponentProps = {
  isPremium: DerivedValue<number>;
  color: DerivedValue<string>;
};

export const AnimatedHomeHeaderCentralComponent = ({
  isPremium,
  color,
}: AnimatedHomeHeaderCentralComponentProps) => {
  const iconStyles = useAnimatedStyle(() => ({
    tintColor: color.value,
  }));

  const svg = useSVG(require('./assets/homeLogo.svg'));

  const premiumIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isPremium.value,
  }));

  return (
    <>
      <Animated.View
        style={[styles.premiumIndicator, premiumIndicatorAnimatedStyle]}
      >
        <PremiumIndicator isRequired size={18} style={iconStyles} />
      </Animated.View>
      <Canvas
        style={{ width: 136, height: 28 }}
        accessibilityLabel="azzapp"
        accessibilityRole="text"
        opaque
      >
        <Mask
          mode="alpha"
          mask={<ImageSVG svg={svg} x={0} y={0} width={136} height={28} />}
        >
          <Rect x={0} y={0} width={136} height={28} color={color} />
        </Mask>
      </Canvas>
    </>
  );
};

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
