import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import type { ViewProps } from 'react-native';

type InfiniteCarouselProps<T = any> = Omit<ViewProps, 'children'> & {
  items: readonly T[];
  itemWidth: number;
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemContainerStyle?: ViewProps['style'];
  style?: ViewProps['style'];
};

function InfiniteCarousel<T = any>({
  items,
  itemWidth,
  keyExtractor,
  renderItem,
  itemContainerStyle,
  style,
  ...props
}: InfiniteCarouselProps<T>) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: items.length * 4000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [animation, items.length]);

  const displayedItems = items
    .map(item => ({ item, isDupe: false }))
    .concat(items.map(item => ({ item, isDupe: true })));

  return (
    <View {...props} style={[style, { flexDirection: 'row' }]}>
      {displayedItems.map(({ item, isDupe }, index) => (
        <Animated.View
          key={`${keyExtractor(item, index)}-${isDupe ? 'dupe' : 'original'}`}
          style={[
            itemContainerStyle,
            {
              transform: [
                {
                  translateX: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -itemWidth * items.length],
                  }),
                },
              ],
            },
          ]}
        >
          {renderItem(item, index)}
        </Animated.View>
      ))}
    </View>
  );
}

export default InfiniteCarousel;
