import { useEffect, useState, type MutableRefObject } from 'react';

let lastScrollY = 0;

// Detect scroll direction
const getScrollDirection = () => {
  const currentScrollY = window?.scrollY;
  const direction = currentScrollY > lastScrollY ? 'down' : 'up';
  lastScrollY = currentScrollY;
  return direction;
};

const useIsVisible = (
  containerRef: MutableRefObject<HTMLDivElement | null>,
) => {
  const [appearance, setAppearance] = useState({
    visible: false,
    scrollDirection: 'down',
  });

  useEffect(() => {
    const currentRef = containerRef.current;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setAppearance({
          visible: entry.isIntersecting,
          scrollDirection: getScrollDirection(),
        });
      },
      {
        root: null, // Observes in the viewport
        threshold: 0.01, // Trigger when 1% of the element is visible
      },
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [containerRef]);

  return appearance;
};

export default useIsVisible;
