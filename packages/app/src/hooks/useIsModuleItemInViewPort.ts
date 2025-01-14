import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import type { Animated } from 'react-native';

const viewportHeight = Dimensions.get('window').height;

const isInsideViewport = (
  scrollPosition: number,
  modulePosition: number,
  moduleHeight: number,
): boolean => {
  const buffer = 10;
  const viewportTop = scrollPosition - buffer;
  const viewportBottom = scrollPosition + viewportHeight + buffer;

  const moduleTop = modulePosition;
  const moduleBottom = modulePosition + moduleHeight;

  // Check if the module is within the viewport or just before or after it
  return (
    (moduleTop >= viewportTop && moduleTop <= viewportBottom) ||
    (moduleBottom >= viewportTop && moduleBottom <= viewportBottom) ||
    (moduleTop <= viewportTop && moduleBottom >= viewportBottom) ||
    (moduleTop <= viewportTop && moduleBottom >= viewportTop) ||
    (moduleTop <= viewportBottom && moduleBottom >= viewportBottom)
  );
};

const useIsModuleItemInViewPort = (
  scrollY: Animated.Value,
  itemStartY: number,
  dimension: { height: number },
) => {
  const [isVisible, setIsVisible] = useState(
    isInsideViewport(
      //@ts-expect-error scrollY is a RNAnimated.Value
      scrollY.__getValue(),
      itemStartY,
      dimension.height,
    ),
  );

  useEffect(() => {
    // Initial check

    const listener = scrollY.addListener(({ value }) => {
      setIsVisible(isInsideViewport(value, itemStartY, dimension.height));
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, itemStartY, dimension]);

  return isVisible;
};

export default useIsModuleItemInViewPort;
