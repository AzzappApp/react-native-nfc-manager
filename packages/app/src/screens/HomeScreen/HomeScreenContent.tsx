import { isEqual } from 'lodash';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  StatusBar,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { CONTACT_CARD_RATIO } from '#components/ContactCard/ContactCard';
import { useOnFocus, useRouteWillChange } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import HomeBackground from './HomeBackground';
import HomeBottomPanel from './HomeBottomPanel';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import HomeContactCardLandscape from './HomeContactCardLandscape';
import HomeHeader, { HOME_HEADER_HEIGHT } from './HomeHeader';
import { HOME_MENU_HEIGHT } from './HomeMenu';
import HomeProfileLink, {
  PROFILE_LINK_HEIGHT,
  PROFILE_LINK_MARGIN_TOP,
} from './HomeProfileLink';
import HomeProfilesCarousel from './HomeProfilesCarousel';
import type { ProfileInfos } from '#helpers/authStore';
import type { HomeScreenContent_user$key } from '#relayArtifacts/HomeScreenContent_user.graphql';
import type { HomeProfilesCarouselHandle } from './HomeProfilesCarousel';
import type { Disposable } from 'react-relay';

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
          webCard {
            id
            userName
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

  //#region profile switch
  const auth = useAuthState();
  const initialProfileIndex = useMemo(() => {
    const index = user.profiles?.findIndex(
      profile => profile.id === auth.profileInfos?.profileId,
    );
    return index !== undefined && index !== -1 ? index : 0;
    // we only want to run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentProfileIndex, setCurrentProfileIndex] =
    useState(initialProfileIndex);
  const currentProfileIndexRef = useRef(initialProfileIndex);
  const currentProfileIndexSharedValue = useSharedValue(currentProfileIndex);

  const actualCurrentProfileIndex = useDerivedValue(() => {
    if (user?.profiles?.length) {
      return Math.min(
        currentProfileIndexSharedValue.value - 1,
        user.profiles.length - 1,
      );
    } else {
      return currentProfileIndexSharedValue.value;
    }
  }, [user?.profiles?.length]);

  const currentProfile = user.profiles?.[currentProfileIndex];

  useRouteWillChange('HOME', () => {
    const roundedProfileIndexSharedValue = Math.round(
      currentProfileIndexSharedValue.value,
    );

    if (roundedProfileIndexSharedValue !== currentProfileIndexSharedValue.value)
      currentProfileIndexSharedValue.value = roundedProfileIndexSharedValue;
  });

  const switchWebCard = useDebouncedCallback((profileInfos: ProfileInfos) => {
    if (!isEqual(profileInfos, auth.profileInfos)) {
      void dispatchGlobalEvent({
        type: 'WEBCARD_CHANGE',
        payload: profileInfos,
      });
    }
  }, 50);

  const onCurrentProfileIndexChange = useCallback(
    (index: number) => {
      currentProfileIndexRef.current = index;
      setCurrentProfileIndex(index);
      const newProfile = user.profiles?.[index];
      if (newProfile) {
        const {
          id: profileId,
          webCard: { id: webCardId },
          profileRole,
        } = newProfile ?? {};
        switchWebCard({
          profileId,
          webCardId,
          profileRole,
        });
      }
    },
    [setCurrentProfileIndex, switchWebCard, user.profiles],
  );

  const carouselRef = useRef<HomeProfilesCarouselHandle>(null);

  useOnFocus(() => {
    const authProfileIndex = user.profiles?.findIndex(
      profile => profile.id === auth.profileInfos?.profileId,
    );
    if (
      authProfileIndex !== undefined &&
      authProfileIndex !== -1 &&
      authProfileIndex !== currentProfileIndexRef.current
    ) {
      carouselRef.current?.scrollToProfileIndex(authProfileIndex, false);
    }
  });
  //#endregion

  // #region prefetch
  const prefetchRoute = usePrefetchRoute();

  useEffect(() => {
    let disposable: Disposable | undefined;
    if (currentProfileIndex === -1) {
      disposable = prefetchRoute(getRelayEnvironment(), {
        route: 'NEW_WEBCARD',
      });
    }
    return () => {
      disposable?.dispose();
    };
  }, [currentProfileIndex, prefetchRoute]);

  // we need to keep a ref to the profiles to avoid prefetching when the user `profiles` field changes
  const profilesRef = useRef(user.profiles);
  useEffect(() => {
    profilesRef.current = user.profiles;
  }, [user.profiles]);

  const profilesDisposables = useRef<Disposable[]>([]).current;
  useEffect(() => {
    const profileInfos = auth.profileInfos;
    if (profileInfos) {
      const profile = profilesRef.current?.find(
        profile => profile.id === profileInfos.profileId,
      );
      if (profile) {
        const environment = getRelayEnvironment();
        profilesDisposables.push(
          prefetchRoute(environment, {
            route: 'WEBCARD',
            params: {
              webCardId: profileInfos.webCardId,
              userName: profile.webCard.userName,
            },
          }),
          prefetchRoute(environment, {
            route: 'CONTACT_CARD',
          }),
        );
      }
    }
  }, [profilesDisposables, prefetchRoute, auth.profileInfos]);

  useEffect(
    () => () => {
      profilesDisposables.forEach(disposable => disposable.dispose());
      profilesDisposables.length = 0;
    },
    [profilesDisposables],
  );
  // #endregion

  // #region Layout
  const insets = useScreenInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  // windowsHeight return by android can have some issue (navbar/statusbar).
  ///navbar is not included in useWindowsDimensions.onLayout is the way to go in case of further ratio issue on multiple android
  const contentHeight = useMemo(
    () =>
      Math.floor(windowHeight) -
      insets.top -
      HOME_HEADER_HEIGHT -
      PROFILE_LINK_HEIGHT -
      PROFILE_LINK_MARGIN_TOP -
      BOTTOM_MENU_GAP -
      BOTTOM_MENU_HEIGHT -
      insets.bottom -
      (Platform.OS === 'android' ? StatusBar?.currentHeight ?? 0 : 0),
    [insets.bottom, insets.top, windowHeight],
  );

  const bottomPanelHeight = useMemo(() => {
    return PixelRatio.roundToNearestPixel(
      (windowWidth - 40) / CONTACT_CARD_RATIO + HOME_MENU_HEIGHT,
    );
  }, [windowWidth]);

  //used PixelRatio because different amount of pixels per square inch on android.
  const carouselHeight = useMemo(
    () => PixelRatio.roundToNearestPixel(contentHeight - bottomPanelHeight),
    [bottomPanelHeight, contentHeight],
  );
  // #endregion

  // #region bottomMenu
  const [showMenu, toggleShowMenu] = useToggle(false);

  // #endregion

  return (
    <View style={styles.container}>
      <HomeBackground
        user={user}
        currentProfileIndexSharedValue={actualCurrentProfileIndex}
      />
      <View style={styles.contentContainer}>
        <HomeHeader
          openPanel={toggleShowMenu}
          user={user}
          currentProfileIndexSharedValue={actualCurrentProfileIndex}
          style={{ marginTop: insets.top }}
        />
        <HomeProfileLink
          user={user}
          currentProfileIndexSharedValue={actualCurrentProfileIndex}
          currentProfileIndex={currentProfileIndex}
        />
        <HomeProfilesCarousel
          ref={carouselRef}
          user={user}
          height={carouselHeight}
          onCurrentProfileIndexChange={onCurrentProfileIndexChange}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          initialProfileIndex={initialProfileIndex}
        />
        <HomeBottomPanel
          height={bottomPanelHeight}
          user={user}
          currentProfileIndexSharedValue={actualCurrentProfileIndex}
          currentProfileIndex={currentProfileIndex}
        />
      </View>
      <HomeContactCardLandscape profile={currentProfile ?? null} />
      <HomeBottomSheetPanel
        visible={showMenu}
        close={toggleShowMenu}
        withProfile={currentProfileIndex !== -1}
        profile={currentProfile ?? null}
        profileRole={currentProfile?.profileRole ?? null}
      />
    </View>
  );
};

export default HomeScreenContent;

const BOTTOM_MENU_GAP = 15;

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
