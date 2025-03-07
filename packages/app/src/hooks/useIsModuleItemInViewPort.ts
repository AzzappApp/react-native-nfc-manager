import { useState, useEffect } from 'react';
import type { CardModuleDimension } from '#components/cardModules/cardModuleEditorType';
import type { Animated } from 'react-native';
const isInsideViewport = (
  scrollPosition: number,
  modulePosition: number,
  moduleHeight: number,
  viewportHeight: number,
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
  dimension: CardModuleDimension,
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
          dimension.height,
        ),
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLayoutReady]);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setIsVisible(
        isInsideViewport(value, itemStartY, componentheight, dimension.height),
      );
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, itemStartY, componentheight, dimension.height]);

  return cancel ? false : isVisible;
};

export default useIsModuleItemInViewPort;
