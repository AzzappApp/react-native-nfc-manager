import { Dimensions, Image, StatusBar, StyleSheet } from 'react-native';
import Animated, { Easing, FadeOut } from 'react-native-reanimated';
import ActivityIndicator from '#ui/ActivityIndicator';
import { ACTIVITY_INDICATOR_WIDTH } from '#ui/ActivityIndicator/ActivityIndicator';

const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

const exiting = FadeOut.duration(500).easing(Easing.ease);

const LoadingScreen = () => {
  return (
    <Animated.View exiting={exiting} style={styles.container}>
      <Image source={require('#assets/logo-full.png')} style={styles.logo} />
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
    zIndex: 1000,
    overflow: 'visible',
    resizeMode: 'contain',
  },
  indicator: {
    position: 'absolute',
    top: (windowHeight - (StatusBar.currentHeight ?? 0)) / 2 + 40,
    left: (windowWidth - ACTIVITY_INDICATOR_WIDTH) / 2,
  },
});

export default LoadingScreen;
