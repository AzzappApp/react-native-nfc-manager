import { useCallback, useEffect, useState } from 'react';

type Dimensions = {
  width: number;
  height: number;
};

export const useDimensions = (targetRef: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleResize = useCallback(() => {
    const dim = targetRef.current?.getBoundingClientRect().toJSON();
    setDimensions({
      width: dim.width || window.innerWidth,
      height: dim.height || window.innerHeight,
    });
  }, [targetRef]);

  useEffect(() => {
    handleResize();
    const observer = new ResizeObserver(() => handleResize());
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      handleResize();
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, targetRef]);

  return dimensions;
};

export default useDimensions;
