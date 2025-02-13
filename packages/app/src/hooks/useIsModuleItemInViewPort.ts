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
  componentheight: number,
  isLayoutReady: boolean, // sometimes we need to wait for the layout to calculate the initial position when we did not start the scrolling
  cancel: boolean,
) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLayoutReady) {
      setIsVisible(
        isInsideViewport(
          //@ts-expect-error - __getValue is private but we need it
          scrollY.__getValue(),
          itemStartY,
          componentheight,
        ),
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLayoutReady]);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setIsVisible(isInsideViewport(value, itemStartY, componentheight));
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, itemStartY, componentheight]);

  return cancel ? false : isVisible;
};

export default useIsModuleItemInViewPort;
