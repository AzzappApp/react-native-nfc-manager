import { useMemo, useCallback, memo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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
  //#region data
  const user = useFragment(
    graphql`
      fragment HomeBottomPanel_user on User {
        ...HomeContactCard_user
        userSubscription {
          issuer
        }
        profiles {
          id
          invited
          profileRole
          promotedAsOwner
          webCard {
            id
            isMultiUser
            userName
            cardIsPublished
            hasCover
            owner {
              email
              phoneNumber
            }
            cardModules {
              kind
            }
            webCardKind
            cardColors {
              primary
              dark
            }
          }
          ...HomeBottomPanelMessage_profiles
        }
      }
    `,
    userKey,
  );
  const { profiles } = user;
  //#endregion

  //#region Layout
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = windowWidth - 40;
  const panelHeight = panelWidth / CONTACT_CARD_RATIO;
  //#endregion

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
    <View style={containerStyle}>
      <View style={styles.informationPanel}>
        <HomeBottomPanelMessage
          user={profiles!}
          userSubscription={user.userSubscription}
        />
      </View>
      <Animated.View
        style={[styles.bottomPanel, bottomPanelStyle]}
        collapsable={false}
      >
        <HomeContactCard
          height={panelHeight}
          width={panelWidth}
          gap={20}
          user={user}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  informationPanel: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPanel: {
    overflow: 'visible',
    flex: 1,
  },
});

export default memo(HomeBottomPanel);
