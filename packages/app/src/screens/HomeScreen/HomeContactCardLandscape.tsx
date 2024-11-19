import {
  DeviceMotionOrientation,
  DeviceMotion,
  Accelerometer,
} from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StatusBar,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import ContactCard, {
  CONTACT_CARD_RATIO,
} from '#components/ContactCard/ContactCard';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useCurrentRoute } from '#components/NativeRouter';
import type { HomeContactCardLandscape_profile$key } from '#relayArtifacts/HomeContactCardLandscape_profile.graphql';

type HomeContactCardLandscapeProps = {
  profile: HomeContactCardLandscape_profile$key | null;
};

const HomeContactCardLandscape = ({
  profile: profileKey,
}: HomeContactCardLandscapeProps) => {
  const profile = useFragment(
    graphql`
      fragment HomeContactCardLandscape_profile on Profile {
        ...ContactCard_profile
        id
        webCard {
          id
          cardIsPublished
          hasCover
        }
        promotedAsOwner
        invited
      }
    `,
    profileKey,
  );

  const currentRoute = useCurrentRoute();

  const [orientation, setOrientation] = useState(
    DeviceMotionOrientation.Portrait,
  );
  const orientationRef = useRef(orientation);
  const visibleSharedValue = useSharedValue(0);

  const shouldShow =
    profile?.webCard?.hasCover &&
    profile?.webCard?.cardIsPublished &&
    !profile?.invited &&
    !profile.promotedAsOwner &&
    currentRoute?.route === 'HOME' &&
    Math.abs(orientation) === 90;

  useEffect(() => {
    if (!shouldShow) {
      return () => {};
    }
    setMainTabBarOpacity(0);
    return () => {
      setMainTabBarOpacity(1);
    };
  }, [shouldShow]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Accelerometer.setUpdateInterval(1000);
    }

    const subscription =
      Platform.OS === 'android'
        ? Accelerometer.addListener(accelerometerData => {
            const { x, y, z } = accelerometerData;

            let orientation = DeviceMotionOrientation.Portrait;

            // Check if the device is flat by looking for z values near ±9.8
            const isFlat = Math.abs(z) < 1.02 && Math.abs(z) > 0.99; // Adjust as needed for tolerance

            if (!isFlat) {
              // Only calculate orientation when not flat
              if (Math.abs(x) > Math.abs(y)) {
                orientation =
                  x > 0
                    ? DeviceMotionOrientation.RightLandscape
                    : DeviceMotionOrientation.LeftLandscape;
              } else {
                orientation =
                  y > 0
                    ? DeviceMotionOrientation.UpsideDown
                    : DeviceMotionOrientation.Portrait;
              }
            }

            const visible = Math.abs(orientation) === 90;
            visibleSharedValue.value = withTiming(visible ? 1 : 0, {
              duration: 120,
            });

            setOrientation(orientation);
          })
        : DeviceMotion.addListener(({ orientation }) => {
            if (orientation !== orientationRef.current) {
              const visible = Math.abs(orientation) === 90;
              visibleSharedValue.value = withTiming(visible ? 1 : 0, {
                duration: 120,
              });
              orientationRef.current = -orientation;
              setOrientation(-orientation);
            }
          });

    return () => subscription.remove();
  }, [visibleSharedValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: profile?.invited ? 0 : visibleSharedValue.value,
  }));

  const appearance = useColorScheme();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  if (!profile || !profile.webCard?.cardIsPublished) {
    return null;
  }

  const targetHeight = windowHeight + (StatusBar.currentHeight ?? 0);

  const smallContactCardHeight = (windowWidth - 40) / CONTACT_CARD_RATIO;
  const scale = (windowWidth - 40) / smallContactCardHeight;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: (targetHeight - windowWidth) / 2,
          left: (windowWidth - targetHeight) / 2,
          backgroundColor: appearance === 'dark' ? colors.black : colors.white,
          transform: [{ rotate: `${orientation}deg` }],
          height: windowWidth,
          width: targetHeight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={{
          transform: [{ scale }],
        }}
      >
        <ContactCard
          profile={profile}
          height={smallContactCardHeight}
          withRotationArrows
        />
      </View>
    </Animated.View>
  );
};

export default HomeContactCardLandscape;
