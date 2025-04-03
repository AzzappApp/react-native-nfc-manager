import {
  Canvas,
  ImageSVG,
  Mask,
  Rect,
  useSVG,
} from '@shopify/react-native-skia';
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
import { useTooltipContext } from '#helpers/TooltipContext';
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
  const { isPremium, profiles } = useFragment(
    graphql`
      fragment HomeHeader_user on User {
        isPremium
        profiles {
          webCard {
            id
            cardColors {
              primary
            }
          }
        }
      }
    `,
    userKey,
  );

  const { currentIndexSharedValue } = useHomeScreenContext();
  const { toggleTooltips } = useTooltipContext();

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

  const premiumIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity:
      currentIndexSharedValue.value > 1 ? 1 : currentIndexSharedValue.value,
    pointerEvents: currentIndexSharedValue.value >= 1 ? 'auto' : 'none',
  }));

  const openHilt = () => {
    toggleTooltips(['profileBottomPanel', 'profileCarousel', 'profileLink']);
  };

  return (
    <Header
      leftElement={
        <Animated.View
          style={[styles.rightButtonContainer, premiumIndicatorAnimatedStyle]}
        >
          <IconButton
            icon="information"
            iconSize={26}
            size={45}
            variant="icon"
            iconStyle={iconStyles}
            onPress={openHilt}
          />
        </Animated.View>
      }
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

type AnimatedHomeHeaderCentralComponentProps = {
  isPremium: boolean | null;
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

  return (
    <>
      {isPremium && (
        <View style={styles.premiumIndicator}>
          <PremiumIndicator isRequired size={18} style={iconStyles} />
        </View>
      )}
      {/** 2 pixel more to avoid crop problem */}
      <Canvas
        style={{
          width: 136,
          height: 30,
        }}
        accessibilityLabel="azzapp"
        accessibilityRole="text"
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
    height: 30,
  },
  premiumIndicator: {
    position: 'absolute',
    right: -20,
    top: -10,
  },
});
