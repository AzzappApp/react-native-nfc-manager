import _ from 'lodash';
import { useState, memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
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
  /**
   * the height unit determined at main screen to have a adaptable layout based on screen size
   *
   * @type {number}
   */
  height: number;
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
  height,
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
    return (
      profiles?.map(profile => {
        if (!profile) return 0;
        return profile?.webCard?.cardCover != null &&
          profile?.webCard?.cardIsPublished &&
          !profile?.invited &&
          !profile.promotedAsOwner
          ? 1
          : 0;
      }) ?? []
    );
  }, [profiles]);

  const inputRange = _.range(0, profiles?.length);

  const mainTabBarVisible = useDerivedValue(() => {
    if (inputRange.length > 1) {
      return Math.pow(
        interpolate(
          currentProfileIndexSharedValue.value,
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
    if (inputRange.length > 1) {
      const index = Math.round(currentProfileIndexSharedValue.value);
      const opacity = interpolate(
        currentProfileIndexSharedValue.value,
        inputRange,
        bottomPanelVisible,
      );
      return {
        opacity: Math.pow(opacity, 3),
        pointerEvents: bottomPanelVisible[index] === 1 ? 'box-none' : 'none',
      };
    } else {
      return {
        opacity: bottomPanelVisible[0],
        pointerEvents: bottomPanelVisible[0] === 1 ? 'box-none' : 'none',
      };
    }
  }, [bottomPanelVisible, currentProfileIndexSharedValue.value, inputRange]);

  useMainTabBarVisibilityController(mainTabBarVisible);
  //#endregion

  const panelHeight = height - HOME_MENU_HEIGHT;

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
            user={user}
            height={panelHeight}
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
            height={panelHeight}
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
            height={panelHeight}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
