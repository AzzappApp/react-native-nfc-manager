import { useState, useMemo, useCallback, startTransition } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { getTextColorPrimaryForBackground } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import { CONTACT_CARD_RATIO } from '#components/ContactCard/ContactCard';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import TabView from '#ui/TabView';
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
  const { currentIndexSharedValue, inputRange } = useHomeScreenContext();

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

  //#region MainTabBar and panel visibility
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

  // # region NewContacts notification
  const profilesInfos = useMemo(
    () => [
      {
        nbNewContacts: 0,
        notificationColor: colors.red400,
      },
      ...(profiles?.map(({ nbNewContacts, webCard }) => {
        return {
          nbNewContacts,
          notificationColor: getTextColorPrimaryForBackground(
            webCard?.cardColors?.primary ?? colors.red400,
            webCard?.cardColors?.dark ?? '#000000',
          ),
        };
      }) ?? []),
    ],
    [profiles],
  );
  const nbNewContactsDerivedValue = useDerivedValue(() => {
    const actual = currentIndexSharedValue.value;
    if (actual >= 0 && inputRange && inputRange.value.length > 1) {
      return interpolate(
        actual,
        inputRange.value,
        profilesInfos.map(profile => profile.nbNewContacts),
      );
    } else if (actual >= 0) {
      return profilesInfos[0].nbNewContacts;
    }
    return 0;
  }, [currentIndexSharedValue]);

  const notificationColor = useDerivedValue(() => {
    const actual = currentIndexSharedValue.value;
    if (actual >= 0 && inputRange && inputRange.value.length > 1) {
      return interpolateColor(
        actual,
        inputRange.value,
        profilesInfos.map(({ notificationColor }) => notificationColor),
      );
    } else if (actual >= 0) {
      const { notificationColor } = profilesInfos[0];
      return notificationColor;
    }
    return colors.red400;
  }, [currentIndexSharedValue]);

  const newContactsOpacity = useDerivedValue(
    () => Math.min(nbNewContactsDerivedValue.value, 1),
    [nbNewContactsDerivedValue],
  );
  // #endregion

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
          setSelected={onSelectedPanelChange}
          newContactsOpacity={newContactsOpacity}
          notificationColor={notificationColor}
        />
        <TabView
          style={{ flex: 1, height: panelHeight }}
          currentTab={selectedPanel}
          mountOnlyCurrentTab
          tabs={[
            {
              id: 'CONTACT_CARD',
              element: <HomeContactCard height={panelHeight} user={user} />,
            },
            {
              id: 'INFORMATION',
              element: (
                <View style={{ paddingHorizontal: 20, height: panelHeight }}>
                  <HomeInformations
                    user={user}
                    height={panelHeight}
                    width={panelWidth}
                    notificationColor={notificationColor}
                    nbNewContacts={nbNewContactsDerivedValue}
                    newContactsOpacity={newContactsOpacity}
                  />
                </View>
              ),
            },
            {
              id: 'STATS',
              element: (
                <View style={{ paddingHorizontal: 20, height: panelHeight }}>
                  <HomeStatistics user={profiles!} height={panelHeight} />
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

export default HomeBottomPanel;
