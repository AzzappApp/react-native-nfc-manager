import { DeviceMotionOrientation, DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import ContactCard from '#components/ContactCard';
import { useMainTabBarVisiblilityController } from '#components/MainTabBar';
import type { HomeContactCardLandscape_profile$key } from '@azzapp/relay/artifacts/HomeContactCardLandscape_profile.graphql';

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
        cardIsPublished
      }
    `,
    profileKey,
  );

  const [orientation, setOrientation] = useState(
    DeviceMotionOrientation.Portrait,
  );
  const orientationRef = useRef(orientation);
  const visibleSharedValue = useSharedValue(0);
  const tabBarVisibleSharedValue = useDerivedValue(
    () => 1 - visibleSharedValue.value,
    [visibleSharedValue],
  );
  useEffect(() => {
    // could be improve using a hook to know if this is the current display screen
    // maybe to much battery consuming
    DeviceMotion.setUpdateInterval(1000);
    const subscription = DeviceMotion.addListener(({ orientation }) => {
      if (orientation !== orientationRef.current) {
        const visible = Math.abs(orientation) === 90;
        visibleSharedValue.value = withTiming(visible ? 1 : 0, {
          duration: 120,
        });
        orientationRef.current = -orientation;
        setOrientation(-orientation);
      }
    });

    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visibleSharedValue.value,
  }));

  useMainTabBarVisiblilityController(
    tabBarVisibleSharedValue,
    Math.abs(orientation) === 90,
  );

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  if (!profile || !profile.cardIsPublished) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: (windowHeight - windowWidth) / 2,
          left: (windowWidth - windowHeight) / 2,
          backgroundColor: 'white',
          transform: [{ rotate: `${orientation}deg` }],
          height: windowWidth,
          width: windowHeight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <ContactCard profile={profile} height={windowWidth - 40} />
    </Animated.View>
  );
};

export default HomeContactCardLandscape;
