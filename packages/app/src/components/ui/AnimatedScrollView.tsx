import { Animated } from 'react-native';
import useLatestCallback from '#hooks/useLatestCallback';
import type { ScrollViewProps } from 'react-native';

export type AnimatedScrollViewProps = ScrollViewProps & {
  scrollAnimatedValue: Animated.Value;
  useNativeDriver?: boolean;
};

const AnimatedScrollView = ({
  scrollAnimatedValue,
  useNativeDriver = true,
  onScroll,
  ...props
}: AnimatedScrollViewProps) => {
  const onScrollLatest = useLatestCallback(onScroll);

  const scrollEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }],
    { useNativeDriver, listener: onScrollLatest },
  );

  return <Animated.ScrollView {...props} onScroll={scrollEvent} />;
};

export default AnimatedScrollView;
