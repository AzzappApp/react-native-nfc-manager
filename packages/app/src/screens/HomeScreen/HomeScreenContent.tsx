import { isEqual } from 'lodash';
import { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import {
  useOnFocus,
  useRouteWillChange,
  useScreenHasFocus,
} from '#components/NativeRouter';
import { addAuthStateListener, getAuthState } from '#helpers/authStore';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
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
          invited
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
  const { bottom } = useScreenInsets();
  //#region profile switch
  const initialProfileIndex = useMemo(() => {
    const index = user.profiles?.findIndex(
      profile => profile.id === getAuthState().profileInfos?.profileId,
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

  const currentProfile = useMemo(
    () => user.profiles?.[currentProfileIndex],
    [currentProfileIndex, user.profiles],
  );

  useEffect(() => {
    if (user.profiles?.length === 0) {
      dispatchGlobalEvent({
        type: 'WEBCARD_CHANGE',
        payload: {
          profileId: '',
          webCardId: '',
          profileRole: '',
        },
      });
    }
  }, [currentProfile, user.profiles?.length]);

  useRouteWillChange('HOME', () => {
    const roundedProfileIndexSharedValue = Math.round(
      currentProfileIndexSharedValue.value,
    );

    if (roundedProfileIndexSharedValue !== currentProfileIndexSharedValue.value)
      currentProfileIndexSharedValue.value = roundedProfileIndexSharedValue;
  });

  const focus = useScreenHasFocus();

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
          invited,
        } = newProfile ?? {};
        const profileInfos = {
          profileId,
          webCardId,
          profileRole: invited ? 'invited' : profileRole,
        };
        const auth = getAuthState();

        if (focus && !isEqual(profileInfos, auth.profileInfos)) {
          void dispatchGlobalEvent({
            type: 'WEBCARD_CHANGE',
            payload: profileInfos,
          });
        }
      }
    },
    [focus, user.profiles],
  );

  const carouselRef = useRef<HomeProfilesCarouselHandle>(null);

  useOnFocus(() => {
    const { profileInfos } = getAuthState();
    const authProfileIndex = user.profiles?.findIndex(
      profile => profile.id === profileInfos?.profileId,
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
    const dispose = addAuthStateListener(({ profileInfos }) => {
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
    });
    return dispose;
  }, [profilesDisposables, prefetchRoute]);

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

  const headerStyle = useMemo(() => ({ marginTop: insets.top }), [insets.top]);

  // windowsHeight return by android can have some issue (navbar/statusbar).
  ///navbar is not included in useWindowsDimensions.onLayout is the way to go in case of further ratio issue on multiple android

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
      <View
        style={[
          styles.contentContainer,
          { paddingBottom: bottom + BOTTOM_MENU_HEIGHT + 15 },
        ]}
      >
        <HomeHeader
          openPanel={toggleShowMenu}
          user={user}
          currentProfileIndexSharedValue={actualCurrentProfileIndex}
          style={headerStyle}
        />
        <HomeProfileLink
          user={user}
          currentProfileIndexSharedValue={actualCurrentProfileIndex}
        />
        <HomeProfilesCarousel
          ref={carouselRef}
          user={user}
          onCurrentProfileIndexChange={onCurrentProfileIndexChange}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          initialProfileIndex={initialProfileIndex}
        />
        <HomeBottomPanel
          user={user}
          currentProfileIndexSharedValue={actualCurrentProfileIndex}
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
