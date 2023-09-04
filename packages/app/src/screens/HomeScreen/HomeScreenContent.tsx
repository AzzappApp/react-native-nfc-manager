import { DeviceMotionOrientation, DeviceMotion } from 'expo-sensors';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useWorkletCallback,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { useOnFocus, useScreenHasFocus } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useAnimatedState from '#hooks/useAnimatedState';
import useAuthState from '#hooks/useAuthState';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import HomeBackground from './HomeBackground';
import HomeBottomPanel from './HomeBottomPanel';
import HomeContactCardLandscape from './HomeContactCardLandscape';
import HomeHeader from './HomeHeader';
import { MENU_HEIGHT } from './HomeMenu';
import HomeProfileLink from './HomeProfileLink';
import HomeProfilesCarousel from './HomeProfilesCarousel';
import type { HomeProfilesCarouselHandle } from './HomeProfilesCarousel';
import type { HomeScreenContent_user$key } from '@azzapp/relay/artifacts/HomeScreenContent_user.graphql';
import type { LayoutChangeEvent } from 'react-native';

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
          ...ContactCard_profile
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
  const hasFocus = useScreenHasFocus();
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
  const { bottom } = useSafeAreaInsets();

  const [containerHeight, setContainerHeight] = useState(0);
  const bottomMargin = bottom > 0 ? bottom : 13;
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setContainerHeight(
      Math.round((nativeEvent.layout.height - MENU_HEIGHT) / 5),
    );
  }, []);

  // Animation rotation landscape
  const [orientation, setOrientation] = useState(
    DeviceMotionOrientation.Portrait,
  );
  useEffect(() => {
    // could be improve using a hook to know if this is the current display screen
    // maybe to much battery consuming
    DeviceMotion.setUpdateInterval(1000);
    const subscription = DeviceMotion.addListener(deviceMotionData => {
      setOrientation(
        deviceMotionData.orientation === 180 ? 0 : deviceMotionData.orientation,
      );
    });

    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const orientationTimer = useAnimatedState(orientation);
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      justifyContent: 'flex-start',
      paddingBottom: bottomMargin + BOTTOM_MENU_HEIGHT + 15,
      opacity: interpolate(orientationTimer.value, [-90, 0, 90], [0, 1, 0]),
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={containerAnimatedStyle}>
        <HomeBackground
          user={user}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
        />
        <HomeHeader
          openPanel={onShowMenu}
          user={user}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
        />
        <HomeProfileLink
          user={user}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          currentProfileIndex={currentProfileIndex}
        />
        <View style={styles.bottomContainer} onLayout={onLayout}>
          <HomeProfilesCarousel
            ref={carouselRef}
            user={user}
            height={3 * containerHeight}
            onCurrentProfileIndexChange={onCurrentProfileIndexChange}
            onCurrentProfileIndexChangeAnimated={
              onCurrentProfileIndexChangeAnimated
            }
            initialProfileIndex={initialProfileIndex}
          />
          {containerHeight > 0 && (
            <HomeBottomPanel
              containerHeight={containerHeight}
              user={user}
              currentProfileIndexSharedValue={currentProfileIndexSharedValue}
              currentProfileIndex={currentProfileIndex}
            />
          )}
        </View>
      </Animated.View>
      {currentProfile && hasFocus && (
        <HomeContactCardLandscape
          containerHeight={containerHeight}
          profile={currentProfile}
          orientationTimer={orientationTimer}
        />
      )}
    </View>
  );
};

export default HomeScreenContent;

const styles = StyleSheet.create({
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
});
