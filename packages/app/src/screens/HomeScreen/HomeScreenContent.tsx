import { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSharedValue, useWorkletCallback } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { CONTACT_CARD_RATIO } from '#components/ContactCard';
import { useOnFocus } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useAuthState from '#hooks/useAuthState';
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

type HomeScreenContentProps = {
  user: HomeScreenContent_user$key;
  onShowMenu: () => void;
};

const HomeScreenContent = ({
  user: userKey,
  onShowMenu,
}: HomeScreenContentProps) => {
  // data
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
    [switchProfile, user.profiles],
  );

  const carouselRef = useRef<HomeProfilesCarouselHandle>(null);
  const onCurrentProfileIndexChangeAnimated = useWorkletCallback(
    (index: number) => {
      'worklet';
      currentProfileIndexSharedValue.value = index;
    },
    [],
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

  // Layout
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 15);
  const bottomInset = Math.max(insets.bottom, 15);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const contentHeight =
    windowHeight -
    topInset -
    HOME_HEADER_HEIGHT -
    PROFILE_LINK_HEIGHT -
    PROFILE_LINK_MARGIN_TOP -
    BOTTOM_MENU_GAP -
    BOTTOM_MENU_HEIGHT -
    bottomInset;

  const bottomPanelHeight =
    (windowWidth - 40) / CONTACT_CARD_RATIO + HOME_MENU_HEIGHT;
  const carouselHeight = contentHeight - bottomPanelHeight;

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
          style={{ marginTop: topInset }}
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
      <HomeContactCardLandscape profile={currentProfile ?? null} />
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
