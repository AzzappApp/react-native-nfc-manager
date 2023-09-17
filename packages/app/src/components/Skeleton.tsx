import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ViewProps, LayoutChangeEvent } from 'react-native';

const Skeleton = ({ style }: ViewProps) => {
  const styles = useStyleSheet(styleSheet);
  const animation = useRef(new Animated.Value(-1)).current;
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  });

  return (
    <View style={[styles.skeleton, style]} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.skeletonAnimation,
          {
            transform: [
              {
                translateX: animation.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-300, width > 300 ? width : 300],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};
export default Skeleton;

const styleSheet = createStyleSheet(appearance => ({
  skeleton: {
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey900,
    overflow: 'hidden',
  },
  skeletonAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: '100%',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 30,
    opacity: 0.03,
  },
}));
