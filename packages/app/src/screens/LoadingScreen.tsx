import { Image } from 'expo-image';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import Animated, { Easing, FadeOut } from 'react-native-reanimated';
import ActivityIndicator from '#ui/ActivityIndicator';
import { ACTIVITY_INDICATOR_WIDTH } from '#ui/ActivityIndicator/ActivityIndicator';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const exiting = FadeOut.duration(500).easing(Easing.ease);

const LoadingScreen = () => {
  return (
    <Animated.View
      exiting={Platform.OS !== 'ios' ? exiting : undefined}
      style={styles.container}
    >
      <Image
        source={require('#assets/logo-full.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <ActivityIndicator style={styles.indicator} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  logo: {
    width: 180,
    height: 38,
    zIndex: 1,
    overflow: 'visible',
  },
  indicator: {
    position: 'absolute',
    top: windowHeight / 2 + 40,
    left: (windowWidth - ACTIVITY_INDICATOR_WIDTH) / 2,
  },
});

export default LoadingScreen;
