import _ from 'lodash';
import { useState, memo, useMemo } from 'react';
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
import HomeStatistics from './HomeStatistics';
import type { HomeBottomPanel_user$key } from '#relayArtifacts/HomeBottomPanel_user.graphql';

import type { HOME_TAB } from './HomeMenu';
import type { SharedValue } from 'react-native-reanimated';

type HomeBottomPanelProps = {
  user: HomeBottomPanel_user$key;
  /**
   * current position of the scrolling profile (based on profile index and not scrollValue )
   *
   * @type {SharedValue<number>}
   */
  currentProfileIndexSharedValue: SharedValue<number>;
};

// TODO the way of we handle the mutations has been made when multi-actor environment was used, we should refactor that

const HomeBottomPanel = ({
  user: userKey,
  currentProfileIndexSharedValue,
}: HomeBottomPanelProps) => {
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
            cardCover {
              title
            }
            webCardCategory {
              id
            }
            owner {
              email
              phoneNumber
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
  const [selectedPanel, setSelectedPanel] = useState<HOME_TAB>('CONTACT_CARD');
  //#endregion

  const bottomPanelVisible = useMemo(() => {
    const res =
      profiles?.map(profile => {
        if (!profile) return 0;
        return profile?.webCard?.cardCover != null &&
          profile?.webCard?.cardIsPublished &&
          !profile?.invited &&
          !profile.promotedAsOwner
          ? 1
          : 0;
      }) ?? [];
    return [0, ...res];
  }, [profiles]);

  const inputRange = _.range(0, (profiles?.length ?? 0) + 1);

  const mainTabBarVisible = useDerivedValue(() => {
    if (inputRange.length > 1) {
      return Math.pow(
        interpolate(
          currentProfileIndexSharedValue.value + 1,
          inputRange,
          bottomPanelVisible,
        ),
        3,
      );
    } else {
      //use a fixed value is only one profile
      return bottomPanelVisible[0];
    }
  }, [bottomPanelVisible, currentProfileIndexSharedValue.value, inputRange]);

  const bottomPanelStyle = useAnimatedStyle(() => {
    const index = Math.round(currentProfileIndexSharedValue.value + 1);
    const opacity =
      inputRange.length > 1
        ? interpolate(
            currentProfileIndexSharedValue.value + 1,
            inputRange,
            bottomPanelVisible,
          )
        : 1;
    return {
      opacity: Math.pow(opacity, 3),
      pointerEvents: bottomPanelVisible[index] === 1 ? 'box-none' : 'none',
    };
  }, [bottomPanelVisible, currentProfileIndexSharedValue.value, inputRange]);

  useMainTabBarVisibilityController(mainTabBarVisible);
  //#endregion

  return (
    <View style={styles.container}>
      <View style={styles.informationPanel}>
        <HomeBottomPanelMessage
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          user={profiles!}
        />
      </View>
      <Animated.View style={[styles.bottomPanel, bottomPanelStyle]}>
        <HomeMenu selected={selectedPanel} setSelected={setSelectedPanel} />
        <View
          style={{
            flex: 1,
            display: selectedPanel === 'CONTACT_CARD' ? 'flex' : 'none',
          }}
        >
          <HomeContactCard
            height={PANEL_HEIGHT}
            user={user}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          />
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
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          />
        </View>

        <View
          style={{
            flex: 1,
            display: selectedPanel === 'INFORMATION' ? 'flex' : 'none',
          }}
        >
          <HomeInformations
            user={user}
            height={PANEL_HEIGHT}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          />
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

export default memo(HomeBottomPanel);
