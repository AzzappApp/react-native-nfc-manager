import concat from 'lodash/concat';
import {
  useState,
  useMemo,
  useCallback,
  startTransition,
  memo,
  useRef,
} from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { CONTACT_CARD_RATIO } from '#components/ContactCard/ContactCard';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useScreenHasFocus } from '#components/NativeRouter';
import { useTooltipContext } from '#helpers/TooltipContext';
import TabView from '#ui/TabView';
import HomeBottomPanelMessage from './HomeBottomPanelMessage';
import HomeContactCard from './HomeContactCard';
import { useIndexInterpolation } from './homeHelpers';
import HomeMenu, { HOME_MENU_HEIGHT } from './HomeMenu';
import { useHomeScreenContext } from './HomeScreenContext';
import HomeStatistics from './HomeStatistics';
import type { HomeBottomPanel_user$key } from '#relayArtifacts/HomeBottomPanel_user.graphql';
import type { HOME_TAB } from './HomeMenu';

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
          ...HomeStatistics_profiles
          ...HomeBottomPanelMessage_profiles
        }
      }
    `,
    userKey,
  );
  const { profiles } = user;
  //#endregion

  //#region Tab
  const [selectedPanel, setSelectedPanel] = useState<HOME_TAB>('CONTACT_CARD');

  const onSelectedPanelChange = useCallback((tab: HOME_TAB) => {
    startTransition(() => {
      setSelectedPanel(tab);
    });
  }, []);
  //#endregion

  //#region Layout
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = windowWidth - 40;
  const panelHeight = panelWidth / CONTACT_CARD_RATIO;
  //#endregion

  // #region MainTabBar visibility
  const { registerTooltip, unregisterTooltip } = useTooltipContext();
  const { currentIndexSharedValue } = useHomeScreenContext();
  const mainTabBarVisibleInner = useIndexInterpolation(
    currentIndexSharedValue,
    concat(
      0,
      profiles?.map(profile => {
        if (!profile) return 0;
        return profile?.webCard?.hasCover &&
          profile?.webCard?.cardIsPublished &&
          !profile?.invited &&
          !profile.promotedAsOwner
          ? 1
          : 0;
      }) ?? [],
    ),
    0,
  );
  const mainTabBarVisible = useDerivedValue(() =>
    Math.pow(mainTabBarVisibleInner.value, 3),
  );

  const bottomPanelStyle = useAnimatedStyle(() => {
    return {
      opacity: mainTabBarVisible.value,
      pointerEvents:
        Math.round(mainTabBarVisible.value) === 1 ? 'auto' : 'none',
    };
  });

  const hasFocus = useScreenHasFocus();

  const containerHeight = useMemo(
    () => ({
      height: panelHeight + HOME_MENU_HEIGHT,
    }),
    [panelHeight],
  );

  const ref = useRef(null);

  useAnimatedReaction(
    () => mainTabBarVisible.value,
    value => {
      if (hasFocus) {
        setMainTabBarOpacity(value);
      }
    },
  );

  const registerTooltipInner = useCallback(() => {
    if (selectedPanel === 'CONTACT_CARD') {
      registerTooltip('profileBottomPanel', {
        ref,
      });
    } else {
      unregisterTooltip('profileBottomPanel');
    }
  }, [registerTooltip, selectedPanel, unregisterTooltip]);

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
    <View style={containerHeight}>
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
        <HomeMenu
          user={user}
          selected={selectedPanel}
          setSelected={onSelectedPanelChange}
          minWidth={panelWidth}
        />
        <TabView
          style={{ flex: 1, height: panelHeight }}
          currentTab={selectedPanel}
          mountOnlyCurrentTab={Platform.OS === 'ios'}
          tabs={[
            {
              id: 'CONTACT_CARD',
              element: (
                <View
                  ref={ref}
                  style={{ paddingHorizontal: 20, height: panelHeight }}
                >
                  <HomeContactCard
                    height={panelHeight}
                    width={panelWidth}
                    gap={20}
                    user={user}
                  />
                </View>
              ),
            },
            {
              id: 'STATS',
              element: (
                <View style={{ paddingHorizontal: 20, height: panelHeight }}>
                  <HomeStatistics
                    user={profiles!}
                    height={panelHeight}
                    focused={selectedPanel === 'STATS'}
                  />
                </View>
              ),
            },
          ]}
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
