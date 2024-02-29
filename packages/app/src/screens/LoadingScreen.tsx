import { useEffect, useState } from 'react';
import { Dimensions, Image, StatusBar } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ActivityIndicator from '#ui/ActivityIndicator';
import { ACTIVITY_INDICATOR_WIDTH } from '#ui/ActivityIndicator/ActivityIndicator';

type LoadingScreenProps = {
  visible: boolean;
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

const LoadingScreen = ({ visible }: LoadingScreenProps) => {
  const [display, setDisplay] = useState(visible);
  const visibleSharedValue = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (!visible) {
      visibleSharedValue.value = withTiming(
        0,
        {
          duration: 120,
          easing: Easing.inOut(Easing.ease),
        },
        () => {
          runOnJS(setDisplay)(false);
        },
      );
    }
  }, [visible, visibleSharedValue]);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: visibleSharedValue.value,
    };
  }, [visibleSharedValue]);

  if (!display) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: windowWidth,
          height: windowHeight,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        },
        opacityStyle,
      ]}
    >
      <Image
        source={require('#assets/logo-full.png')}
        style={{
          width: 180,
          height: 38,
          zIndex: 1000,
          overflow: 'visible',
          resizeMode: 'contain',
        }}
      />
      <ActivityIndicator
        style={{
          position: 'absolute',
          top: (windowHeight - (StatusBar.currentHeight ?? 0)) / 2 + 40,
          left: (windowWidth - ACTIVITY_INDICATOR_WIDTH) / 2,
        }}
      />
    </Animated.View>
  );
};

export default LoadingScreen;
