import { useState, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { CONTACT_CARD_RATIO } from '#components/ContactCard/ContactCard';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import HomeBottomPanelMessage from './HomeBottomPanelMessage';
import HomeContactCard from './HomeContactCard';
import HomeInformations from './HomeInformations';
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
        ...HomeInformations_user
        profiles {
          id
          invited
          profileRole
          promotedAsOwner
          nbNewContacts
          webCard {
            id
            userName
            cardIsPublished
            hasCover
            webCardCategory {
              id
            }
            owner {
              email
              phoneNumber
            }
            cardModules {
              kind
            }
            webCardKind
          }
          ...HomeStatistics_profiles
          ...HomeBottomPanelMessage_profiles
        }
      }
    `,
    userKey,
  );
  const { profiles } = user;
  const [selectedPanel, setSelectedPanel] = useState<HOME_TAB>('CONTACT_CARD');
  const { currentIndexSharedValue, inputRange } = useHomeScreenContext();
  //#endregion

  const { width: windowWidth } = useWindowDimensions();
  const panelHeight = (windowWidth - 40) / CONTACT_CARD_RATIO;

  const bottomPanelVisible = useDerivedValue(() => {
    const res =
      profiles?.map(profile => {
        if (!profile) return 0;
        return profile?.webCard?.hasCover &&
          profile?.webCard?.cardIsPublished &&
          !profile?.invited &&
          !profile.promotedAsOwner
          ? 1
          : 0;
      }) ?? [];
    return [0, ...res];
  }, [profiles]);

  const mainTabBarVisible = useDerivedValue(() => {
    if (inputRange.value.length > 1) {
      return Math.pow(
        interpolate(
          currentIndexSharedValue.value,
          inputRange.value,
          bottomPanelVisible.value,
        ),
        3,
      );
    } else {
      //use a fixed value is only one profile
      return bottomPanelVisible.value[0];
    }
  });

  const bottomPanelStyle = useAnimatedStyle(() => {
    if (inputRange.value.length === 0)
      return { opacity: 1, pointerEvents: 'box-none' };

    return {
      opacity: mainTabBarVisible.value,
      pointerEvents:
        Math.round(mainTabBarVisible.value) === 1 ? 'auto' : 'none',
    };
  });

  const containerHeight = useMemo(
    () => ({
      height: panelHeight + HOME_MENU_HEIGHT,
    }),
    [panelHeight],
  );

  useMainTabBarVisibilityController(mainTabBarVisible);
  //#endregion

  const { currentIndexProfile } = useHomeScreenContext();
  const newContactsOpacity = useDerivedValue(() => {
    return (user?.profiles?.[currentIndexProfile?.value - 1]?.nbNewContacts ||
      0) > 0
      ? 1
      : 0;
  }, [user?.profiles]);
  const notificationColor = useSharedValue('#00000000');

  return (
    <View style={containerHeight}>
      <View style={styles.informationPanel}>
        <HomeBottomPanelMessage user={profiles!} />
      </View>
      <Animated.View
        style={[styles.bottomPanel, bottomPanelStyle]}
        collapsable={false}
      >
        <HomeMenu
          selected={selectedPanel}
          setSelected={setSelectedPanel}
          newContactsOpacity={newContactsOpacity}
          notificationColor={notificationColor}
        />
        <View
          style={{
            flex: 1,
            display: selectedPanel === 'CONTACT_CARD' ? 'flex' : 'none',
          }}
        >
          <HomeContactCard height={panelHeight} user={user} />
        </View>

        <View
          style={{
            flex: 1,
            display: selectedPanel === 'STATS' ? 'flex' : 'none',
          }}
        >
          <HomeStatistics user={profiles!} height={panelHeight} />
        </View>

        <View
          style={{
            flex: 1,
            display: selectedPanel === 'INFORMATION' ? 'flex' : 'none',
          }}
        >
          <HomeInformations
            user={user}
            height={panelHeight}
            notificationColor={notificationColor}
          />
        </View>
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

export default HomeBottomPanel;
