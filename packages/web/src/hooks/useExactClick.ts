import { useEffect } from 'react';
import type { RefObject } from 'react';

const useExactClick = (target: RefObject<HTMLElement>, onClick: () => void) => {
  useEffect(() => {
    const currentTarget = target.current;
    const clickPosition = { x: 0, y: 0 };

    const onMouseUp = (e: MouseEvent) => {
      const { x, y } = clickPosition;
      if (x === e.clientX && y === e.clientY) onClick();
      currentTarget?.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      clickPosition.x = e.clientX;
      clickPosition.y = e.clientY;

      currentTarget?.addEventListener('mouseup', onMouseUp);
    };

    currentTarget?.addEventListener('mousedown', onMouseDown);

    return () => {
      currentTarget?.removeEventListener('mousedown', onMouseDown);
    };
  }, [target, onClick]);
};

export default useExactClick;
