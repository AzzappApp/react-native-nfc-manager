import { useEffect, useState } from 'react';

let lastScrollY = 0;

// Detect scroll direction
const getScrollDirection = () => {
  const currentScrollY = window?.scrollY;
  const direction = currentScrollY > lastScrollY ? 'down' : 'up';
  lastScrollY = currentScrollY;
  return direction;
};

export const AppearanceSliderContainer = ({
  pictureRef,
  children,
  delaySec,
}: {
  pictureRef: React.MutableRefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  delaySec: number;
}) => {
  const [appearance, setAppearance] = useState({
    visible: false,
    scrollDirection: 'down',
  });

  useEffect(() => {
    const currentRef = pictureRef.current;

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
  }, [pictureRef]);

  return (
    <div
      style={{
        opacity: appearance.visible ? 1 : 0,
        transform: appearance.visible
          ? 'translateY(0)'
          : appearance.scrollDirection === 'down'
            ? 'translateY(-200px)'
            : 'translateY(200px)',
        transition: `opacity 0.5s ease-in-out ${delaySec}s,transform 0.2s ease-out ${delaySec}s`,
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
};
