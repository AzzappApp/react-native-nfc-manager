import { useState } from 'react';
import { useNativeNavigationEvent } from '#components/NativeRouter';

const useCoverPlayPermission = () => {
  const [paused, setPaused] = useState(false);
  const [canPlay, setCanPlay] = useState(true);

  useNativeNavigationEvent('willDisappear', () => {
    setPaused(true);
  });

  useNativeNavigationEvent('disappear', () => {
    setCanPlay(false);
  });

  useNativeNavigationEvent('willAppear', () => {
    setPaused(false);
    setCanPlay(true);
  });

  return { paused, canPlay };
};

export default useCoverPlayPermission;
