import useIsVisible from '#hooks/useIsVisible';

export const AppearanceSliderContainer = ({
  pictureRef,
  children,
  delaySec,
}: {
  pictureRef: React.MutableRefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  delaySec: number;
}) => {
  const appearance = useIsVisible(pictureRef);

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
