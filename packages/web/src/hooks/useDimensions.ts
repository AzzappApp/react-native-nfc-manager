import { useCallback, useEffect, useState } from 'react';

type Dimensions = {
  width: number;
  height: number;
};

export const useDimensions = (targetRef: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState<Dimensions>();

  const handleResize = useCallback(() => {
    setDimensions(targetRef.current?.getBoundingClientRect().toJSON());
  }, [targetRef]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      handleResize();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, targetRef]);

  return dimensions;
};

export default useDimensions;
