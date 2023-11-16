import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  StatusBar,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { CONTACT_CARD_RATIO } from '#components/ContactCard';
import { useOnFocus } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import ProfileBoundRelayEnvironmentProvider from '#helpers/ProfileBoundRelayEnvironmentProvider';
import { ROOT_ACTOR_ID, getRelayEnvironment } from '#helpers/relayEnvironment';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import HomeBackground from './HomeBackground';
import HomeBottomPanel from './HomeBottomPanel';
import HomeContactCardLandscape from './HomeContactCardLandscape';
import HomeHeader, { HOME_HEADER_HEIGHT } from './HomeHeader';
import { HOME_MENU_HEIGHT } from './HomeMenu';
import HomeProfileLink, {
  PROFILE_LINK_HEIGHT,
  PROFILE_LINK_MARGIN_TOP,
} from './HomeProfileLink';
import HomeProfilesCarousel from './HomeProfilesCarousel';
import type { HomeProfilesCarouselHandle } from './HomeProfilesCarousel';
import type { HomeScreenContent_user$key } from '@azzapp/relay/artifacts/HomeScreenContent_user.graphql';
import type { Disposable } from 'react-relay';

type HomeScreenContentProps = {
  user: HomeScreenContent_user$key;
  onShowMenu: () => void;
};

const HomeScreenContent = ({
  user: userKey,
  onShowMenu,
}: HomeScreenContentProps) => {
  // #regions data
  const user = useFragment(
    graphql`
      fragment HomeScreenContent_user on User {
        profiles {
          id
          userName
          ...HomeContactCardLandscape_profile
        }
        ...HomeProfileLink_user
        ...HomeProfilesCarousel_user
        ...HomeBottomPanel_user
        ...HomeBackground_user
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
      profile => profile.id === auth.profileId,
    );
    return index !== undefined && index !== -1 ? index : 0;
    // we only want to run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentProfileIndex, setCurrentProfileIndex] =
    useState(initialProfileIndex);
  const currentProfileIndexRef = useRef(initialProfileIndex);
  const currentProfileIndexSharedValue = useSharedValue(currentProfileIndex);
  const currentProfile = user.profiles?.[currentProfileIndex];

  const switchProfile = useDebouncedCallback((profileId: string) => {
    if (profileId && auth.profileId !== profileId) {
      void dispatchGlobalEvent({
        type: 'PROFILE_CHANGE',
        payload: {
          profileId,
        },
      });
    }
  }, 50);

  const onCurrentProfileIndexChange = useCallback(
    (index: number) => {
      currentProfileIndexRef.current = index;
      setCurrentProfileIndex(index);
      const newProfileId = user.profiles?.[index]?.id;
      if (newProfileId) {
        switchProfile(newProfileId);
      }
    },
    [setCurrentProfileIndex, switchProfile, user.profiles],
  );

  const carouselRef = useRef<HomeProfilesCarouselHandle>(null);
  const onCurrentProfileIndexChangeAnimated = useCallback(
    (index: number) => {
      'worklet';
      currentProfileIndexSharedValue.value = index;
    },
    [currentProfileIndexSharedValue],
  );

  useOnFocus(() => {
    const authProfileIndex = user.profiles?.findIndex(
      profile => profile.id === auth.profileId,
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
      disposable = prefetchRoute(
        getRelayEnvironment().forActor(ROOT_ACTOR_ID),
        { route: 'NEW_PROFILE' },
      );
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
    if (auth.profileId) {
      const profile = profilesRef.current?.find(
        profile => profile.id === auth.profileId,
      );
      if (profile) {
        const multiActorEnvironment = getRelayEnvironment();
        const profileEnvironment = multiActorEnvironment.forActor(profile.id);
        profilesDisposables.push(
          prefetchRoute(profileEnvironment, {
            route: 'PROFILE',
            params: {
              profileId: auth.profileId,
              userName: profile.userName,
            },
          }),
          prefetchRoute(profileEnvironment, {
            route: 'CONTACT_CARD',
          }),
        );
      }
    }
  }, [auth.profileId, profilesDisposables, prefetchRoute]);

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

  return (
    <View style={{ flex: 1 }}>
      <HomeBackground
        user={user}
        currentProfileIndexSharedValue={currentProfileIndexSharedValue}
      />
      <View style={styles.contentContainer}>
        <HomeHeader
          openPanel={onShowMenu}
          user={user}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          style={{ marginTop: insets.top }}
        />
        <HomeProfileLink
          user={user}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          currentProfileIndex={currentProfileIndex}
        />
        <HomeProfilesCarousel
          ref={carouselRef}
          user={user}
          height={carouselHeight}
          onCurrentProfileIndexChange={onCurrentProfileIndexChange}
          onCurrentProfileIndexChangeAnimated={
            onCurrentProfileIndexChangeAnimated
          }
          initialProfileIndex={initialProfileIndex}
        />
        <HomeBottomPanel
          height={bottomPanelHeight}
          user={user}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          currentProfileIndex={currentProfileIndex}
        />
      </View>
      <ProfileBoundRelayEnvironmentProvider
        profileId={currentProfile?.id ?? null}
      >
        <HomeContactCardLandscape profile={currentProfile ?? null} />
      </ProfileBoundRelayEnvironmentProvider>
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
});
