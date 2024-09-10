import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { getAuthState } from '#helpers/authStore';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import HomeBackground from './HomeBackground';
import HomeBottomPanel from './HomeBottomPanel';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import HomeContactCardLandscape from './HomeContactCardLandscape';
import HomeHeader from './HomeHeader';
import HomeProfileLink from './HomeProfileLink';
import HomeProfilesCarousel from './HomeProfilesCarousel';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeScreenContent_user$key } from '#relayArtifacts/HomeScreenContent_user.graphql';

type HomeScreenContentProps = {
  user: HomeScreenContent_user$key;
};

const HomeScreenContent = ({ user: userKey }: HomeScreenContentProps) => {
  // #regions data
  const user = useFragment(
    graphql`
      fragment HomeScreenContent_user on User {
        profiles {
          id
          profileRole
          invited
          webCard {
            cardIsPublished
          }
          ...HomeContactCardLandscape_profile
          ...HomeBottomSheetPanel_profile
        }
        ...HomeBackground_user
        ...HomeProfileLink_user
        ...HomeProfilesCarousel_user
        ...HomeBottomPanel_user
        ...HomeHeader_user
      }
    `,
    userKey,
  );

  //#endregion
  const { bottom } = useScreenInsets();
  //#region profile switch

  const { currentIndexProfile } = useHomeScreenContext();

  const [currentProfile, setCurrentProfile] = useState(
    user.profiles?.[currentIndexProfile.value - 1],
  );
  useAnimatedReaction(
    () => currentIndexProfile.value,
    index => {
      const cProfile = user.profiles?.[index - 1];
      runOnJS(setCurrentProfile)(cProfile);
    },
  );

  // TODO: here we rely on polling on HOME to check if the profileRole has changed. We should have a better way to keep our app state in sync with the server.
  useEffect(() => {
    const { profileInfos } = getAuthState();
    if (
      currentProfile?.profileRole &&
      profileInfos?.profileRole !== currentProfile.profileRole
    ) {
      void dispatchGlobalEvent({
        type: 'PROFILE_ROLE_CHANGE',
        payload: {
          profileRole: currentProfile.profileRole,
        },
      });
    }
  }, [currentProfile?.profileRole]);
  //#endregion

  // #region bottomMenu
  const [showMenu, toggleShowMenu] = useToggle(false);

  // #endregion
  const insets = useScreenInsets();
  const homeContentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      {
        paddingBottom: bottom + BOTTOM_MENU_HEIGHT + 15,
        paddingTop: insets.top + 15,
      },
    ],
    [bottom, insets.top],
  );

  return (
    <View style={styles.container}>
      <HomeBackground user={user} />
      <View style={homeContentContainerStyle}>
        <HomeHeader openPanel={toggleShowMenu} user={user} />
        <HomeProfileLink user={user} />
        <HomeProfilesCarousel user={user} />
        <HomeBottomPanel user={user} />
      </View>
      <HomeContactCardLandscape profile={currentProfile ?? null} />
      <HomeBottomSheetPanel
        visible={showMenu}
        close={toggleShowMenu}
        profile={currentProfile ?? null}
      />
    </View>
  );
};
//usage of memo tested with whyDidYouRender, reducing render due to context change
export default memo(HomeScreenContent);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  container: {
    flex: 1,
  },
});
