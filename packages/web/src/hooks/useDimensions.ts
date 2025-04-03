import { useCallback, useEffect, useState } from 'react';

type Dimensions = {
  width: number;
  height: number;
};

export const useDimensions = (targetRef: React.RefObject<HTMLDivElement>) => {
  const getDimension = useCallback(() => {
    const dim = targetRef.current?.getBoundingClientRect().toJSON();
    return {
      width: dim?.width,
      height: dim?.height,
    };
  }, [targetRef]);

  const [dimensions, setDimensions] = useState<Dimensions>(getDimension);

  const handleResize = useCallback(() => {
    setDimensions(getDimension());
  }, [getDimension]);

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
