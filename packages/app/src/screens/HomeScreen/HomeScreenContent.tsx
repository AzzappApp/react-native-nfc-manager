import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { getAuthState } from '#helpers/authStore';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useBoolean from '#hooks/useBoolean';
import useNotifications from '#hooks/useNotifications';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import HomeBackground from './HomeBackground';
import HomeBottomPanel from './HomeBottomPanel';
import { HomeBottomSheetModalWebCardToolTip } from './HomeBottomSheetModalWebCardToolTip';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import HomeBottomSheetPopupPanel from './HomeBottomSheetPopupPanel';
import HomeHeader from './HomeHeader';
import HomeProfileLink from './HomeProfileLink';
import HomeProfilesCarousel from './HomeProfilesCarousel';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeScreenContent_user$key } from '#relayArtifacts/HomeScreenContent_user.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { Ref } from 'react';

type HomeScreenContentProps = {
  user: HomeScreenContent_user$key;
  selectListRef: Ref<CarouselSelectListHandle>;
  refreshQuery: (() => void) | undefined;
};

const HomeScreenContent = ({
  user: userKey,
  selectListRef,
  refreshQuery,
}: HomeScreenContentProps) => {
  // #regions data
  const user = useFragment(
    graphql`
      fragment HomeScreenContent_user on User {
        profiles {
          id
          profileRole
          invited
          webCard {
            id
            cardIsPublished
            userName
          }
          ...HomeBottomSheetPanel_profile
          ...HomeBottomSheetModalWebCardToolTip_profile
          ...HomeBottomSheetPopupPanel_profile
        }
        ...HomeBackground_user
        ...HomeProfileLink_user
        ...HomeProfilesCarousel_user
        ...HomeBottomPanel_user
        ...HomeHeader_user
        ...HomeHeader_user
      }
    `,
    userKey,
  );

  const onDeepLink = useCallback(
    (deepLink: string) => {
      if (deepLink === 'multiuser_invitation' || deepLink === 'shareBack') {
        refreshQuery?.();
      }
    },
    [refreshQuery],
  );

  const { notificationAuthorized, requestNotificationPermission } =
    useNotifications(onDeepLink);

  //TODO: improve the way to ask for notificatino permission, for now, we are asking for notification permission if the user has a published card
  useEffect(() => {
    if (!notificationAuthorized && user?.profiles && user.profiles.length > 0) {
      const hasPublishedCard = user.profiles.some(
        profile => profile.webCard?.cardIsPublished,
      );
      if (hasPublishedCard) {
        requestNotificationPermission();
      }
    }
  }, [notificationAuthorized, requestNotificationPermission, user.profiles]);
  //#endregion

  //#region profile switch

  const { currentIndexProfileSharedValue, initialProfileIndex } =
    useHomeScreenContext();

  const [currentProfile, setCurrentProfile] = useState(
    user.profiles?.[initialProfileIndex - 1],
  );
  const debouncedUpdate = useDebouncedCallback(setCurrentProfile, 300);

  useAnimatedReaction(
    () => currentIndexProfileSharedValue.value,
    index => {
      const cProfile = user.profiles?.[index - 1];
      runOnJS(debouncedUpdate)(cProfile);
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
  const [showMenu, , closeMenu, toggleMenu] = useBoolean(false);

  // #endregion
  const insets = useScreenInsets();
  const homeContentContainerStyle = useMemo(
    () => [
      styles.container,
      {
        marginTop: insets.top + HOME_SCREEN_CONTENT_PADDING,
        marginBottom:
          insets.bottom + BOTTOM_MENU_HEIGHT + HOME_SCREEN_CONTENT_PADDING,
      },
    ],
    [insets.bottom, insets.top],
  );

  return (
    <View style={styles.container}>
      <HomeBackground user={user} />
      <View style={homeContentContainerStyle}>
        <HomeHeader openPanel={toggleMenu} user={user} />
        <HomeProfileLink user={user} />
        <HomeProfilesCarousel ref={selectListRef} user={user} />
        <HomeBottomPanel user={user} />
      </View>
      <HomeBottomSheetPanel
        visible={showMenu}
        close={closeMenu}
        profile={currentProfile ?? null}
      />
      <HomeBottomSheetModalWebCardToolTip user={currentProfile ?? null} />

      <HomeBottomSheetPopupPanel profile={currentProfile ?? null} />
    </View>
  );
};
//usage of memo tested with whyDidYouRender, reducing render due to context change
export default memo(HomeScreenContent);

export const HOME_SCREEN_CONTENT_PADDING = 15;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
  },
});
