import { useMemo, useCallback, memo, useRef, Suspense } from 'react';
import {
  PixelRatio,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { CONTACT_CARD_RATIO } from '#components/ContactCard/ContactCard';
import { useTooltipContext } from '#helpers/TooltipContext';

import HomeBottomPanelMessage from './HomeBottomPanelMessage';
import HomeContactCard from './HomeContactCard';

import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeBottomPanel_user$key } from '#relayArtifacts/HomeBottomPanel_user.graphql';

type HomeBottomPanelProps = {
  user: HomeBottomPanel_user$key;
};

// TODO the way of we handle the mutations has been made when multi-actor environment was used, we should refactor that

const HomeBottomPanel = ({ user: userKey }: HomeBottomPanelProps) => {
  //#region Layout
  const { width: windowWidth } = useWindowDimensions();
  const panelHeight = PixelRatio.roundToNearestPixel(
    (windowWidth - 40) / CONTACT_CARD_RATIO,
  );
  //#endregion

  const user = useFragment(
    graphql`
      fragment HomeBottomPanel_user on User {
        ...HomeContactCard_user
        ...HomeBottomPanelMessage_user
      }
    `,
    userKey,
  );
  // #region MainTabBar visibility
  const { registerTooltip, unregisterTooltip } = useTooltipContext();
  const { bottomContentOpacity } = useHomeScreenContext();

  const mainTabBarVisible = useDerivedValue(() =>
    Math.pow(bottomContentOpacity.value, 3),
  );

  const bottomPanelStyle = useAnimatedStyle(() => {
    return {
      opacity: bottomContentOpacity.value,
      pointerEvents:
        Math.round(bottomContentOpacity.value) === 1 ? 'auto' : 'none',
    };
  });
  const containerStyle = useMemo(
    () => ({
      height: panelHeight,
    }),
    [panelHeight],
  );

  const ref = useRef(null);

  const registerTooltipInner = useCallback(() => {
    registerTooltip('profileBottomPanel', {
      ref,
    });
  }, [registerTooltip]);

  const unregisterTooltipInner = () => {
    unregisterTooltip('profileBottomPanel');
  };

  const isVisible = useDerivedValue(() => mainTabBarVisible.value === 1);

  useAnimatedReaction(
    () => isVisible.value,
    visible => {
      if (visible) {
        runOnJS(registerTooltipInner)();
      } else {
        runOnJS(unregisterTooltipInner)();
      }
    },
  );

  //#endregion
  return (
    <View style={containerStyle} ref={ref}>
      <View style={[styles.informationPanel, { height: panelHeight }]}>
        <Suspense>
          <HomeBottomPanelMessage user={user} />
        </Suspense>
      </View>
      <Animated.View
        style={[styles.bottomPanel, bottomPanelStyle]}
        collapsable={false}
      >
        <HomeContactCard height={panelHeight} user={user} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  informationPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPanel: {
    overflow: 'visible',
    flex: 1,
  },
});

export default memo(HomeBottomPanel);
