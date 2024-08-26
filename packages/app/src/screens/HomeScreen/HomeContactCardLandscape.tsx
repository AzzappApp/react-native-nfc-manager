import { DeviceMotionOrientation, DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import ContactCard, {
  CONTACT_CARD_RATIO,
} from '#components/ContactCard/ContactCard';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
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
        }
        invited
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
    const subscription = DeviceMotion.addListener(
      ({ orientation, rotation }) => {
        let calculOrientation = orientation;

        if (Platform.OS === 'android') {
          //this is clearly and android hack, if app is lock in portrait mode, we can't get the orientation
          //https://github.com/expo/expo/issues/2430
          calculOrientation = orientationCalculation(
            rotation.gamma,
            rotation.beta,
          );
        }

        if (calculOrientation !== orientationRef.current) {
          const visible = Math.abs(calculOrientation) === 90;
          visibleSharedValue.value = withTiming(visible ? 1 : 0, {
            duration: 120,
          });
          orientationRef.current = -calculOrientation;
          setOrientation(-calculOrientation);
        }
      },
    );

    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: profile?.invited ? 0 : visibleSharedValue.value,
    }),
    [profile?.invited],
  );

  useMainTabBarVisibilityController(
    tabBarVisibleSharedValue,
    Math.abs(orientation) === 90,
  );
  const appearance = useColorScheme();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  if (!profile || !profile.webCard.cardIsPublished) {
    return null;
  }

  const smallContactCardHeight = (windowWidth - 40) / CONTACT_CARD_RATIO;
  const scale = (windowWidth - 40) / smallContactCardHeight;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: (windowHeight - windowWidth) / 2,
          left: (windowWidth - windowHeight) / 2,
          backgroundColor: appearance === 'dark' ? colors.black : colors.white,
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
      <View
        style={{
          transform: [{ scale }],
        }}
      >
        <ContactCard profile={profile} height={smallContactCardHeight} />
      </View>
    </Animated.View>
  );
};

export default HomeContactCardLandscape;

function orientationCalculation(gamma: number, beta: number) {
  const ABSOLUTE_GAMMA = Math.abs(gamma);
  const ABSOLUTE_BETA = Math.abs(beta);
  const isGammaNegative = Math.sign(gamma) === -1;
  let orientation = 0;

  if (ABSOLUTE_GAMMA <= 0.04 && ABSOLUTE_BETA <= 0.24) {
    //Portrait mode, on a flat surface.
    orientation = 0;
  } else if (
    (ABSOLUTE_GAMMA <= 1.0 || ABSOLUTE_GAMMA >= 2.3) &&
    ABSOLUTE_BETA >= 0.5
  ) {
    //General Portrait mode, accounting for forward and back tilt on the top of the phone.
    orientation = 0;
  } else if (isGammaNegative) {
    //Landscape mode with the top of the phone to the left.
    orientation = -90;
  } else {
    //Landscape mode with the top of the phone to the right.
    orientation = 90;
  }
  return orientation;
}
