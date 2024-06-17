import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
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

  const { currentIndexProfile, currentIndexSharedValue } =
    useHomeScreenContext();

  const currentProfile = useMemo(
    () => user.profiles?.[currentIndexProfile.value - 1],
    [currentIndexProfile.value, user.profiles],
  );

  //#endregion

  // #region Layout
  const insets = useScreenInsets();
  const headerStyle = useMemo(() => ({ marginTop: insets.top }), [insets.top]);

  // #endregion

  // #region bottomMenu
  const [showMenu, toggleShowMenu] = useToggle(false);

  // #endregion

  return (
    <View style={styles.container}>
      <HomeBackground user={user} />
      <View
        style={[
          styles.contentContainer,
          { paddingBottom: bottom + BOTTOM_MENU_HEIGHT + 15 },
        ]}
      >
        <HomeHeader
          openPanel={toggleShowMenu}
          user={user}
          style={headerStyle}
        />
        <HomeProfileLink user={user} />
        <HomeProfilesCarousel user={user} />
        <HomeBottomPanel user={user} />
      </View>
      <HomeContactCardLandscape profile={currentProfile ?? null} />
      <HomeBottomSheetPanel
        visible={showMenu}
        close={toggleShowMenu}
        withProfile={currentIndexSharedValue.value >= 1}
        profile={currentProfile ?? null}
        profileRole={currentProfile?.profileRole ?? null}
      />
    </View>
  );
};

export default HomeScreenContent;

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
