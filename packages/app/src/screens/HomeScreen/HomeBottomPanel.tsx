import { useState, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
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
  const { inputRange, currentIndexSharedValue } = useHomeScreenContext();
  //#endregion

  const bottomPanelVisible = useMemo(() => {
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
    if (inputRange.length > 1) {
      return Math.pow(
        interpolate(
          currentIndexSharedValue.value,
          inputRange,
          bottomPanelVisible,
        ),
        3,
      );
    } else {
      //use a fixed value is only one profile
      return bottomPanelVisible[0];
    }
  }, [bottomPanelVisible, currentIndexSharedValue.value, inputRange]);
  const bottomPanelStyle = useAnimatedStyle(() => {
    if (inputRange.length === 0)
      return { opacity: 1, pointerEvents: 'box-none' };

    return {
      opacity: mainTabBarVisible.value,
      pointerEvents:
        Math.round(mainTabBarVisible.value) === 1 ? 'auto' : 'none',
    };
  });

  useMainTabBarVisibilityController(mainTabBarVisible);
  //#endregion

  const stateIndex = useDerivedValue(
    () => currentIndexSharedValue.value - 1,
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.informationPanel}>
        <HomeBottomPanelMessage user={profiles!} />
      </View>
      <Animated.View
        style={[styles.bottomPanel, bottomPanelStyle]}
        collapsable={false}
      >
        <HomeMenu selected={selectedPanel} setSelected={setSelectedPanel} />
        <View
          style={{
            flex: 1,
            display: selectedPanel === 'CONTACT_CARD' ? 'flex' : 'none',
          }}
        >
          <HomeContactCard height={PANEL_HEIGHT} user={user} />
        </View>

        <View
          style={{
            flex: 1,
            display: selectedPanel === 'STATS' ? 'flex' : 'none',
          }}
        >
          <HomeStatistics
            user={profiles!}
            height={PANEL_HEIGHT}
            currentProfileIndexSharedValue={stateIndex} //we still need to passe it for the MultiUserstats panel. we should split / refactor them for better performance
          />
        </View>

        <View
          style={{
            flex: 1,
            display: selectedPanel === 'INFORMATION' ? 'flex' : 'none',
          }}
        >
          <HomeInformations user={user} height={PANEL_HEIGHT} />
        </View>
      </Animated.View>
    </View>
  );
};

const { width: windowWidth } = Dimensions.get('screen');
const PANEL_HEIGHT = (windowWidth - 40) / CONTACT_CARD_RATIO;

const styles = StyleSheet.create({
  container: {
    height: PANEL_HEIGHT + HOME_MENU_HEIGHT,
  },
  informationText: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
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
  informationPanelButton: {
    marginTop: 30,
  },
  invitationButtons: { rowGap: 15, marginTop: 35 },
  invitationPanelButton: {
    minWidth: 250,
  },

  message: {
    color: colors.white,
  },
});

export default HomeBottomPanel;
