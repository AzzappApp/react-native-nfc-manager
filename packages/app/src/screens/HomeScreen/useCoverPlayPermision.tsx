import { useState } from 'react';
import { useNativeNavigationEvent } from '#components/NativeRouter';

const useCoverPlayPermission = () => {
  const [paused, setPaused] = useState(false);
  const [canPlay, setCanPlay] = useState(true);

  useNativeNavigationEvent('willDisappear', () => {
    setPaused(true);
    console.log('willDisappear');
  });

  useNativeNavigationEvent('disappear', () => {
    setCanPlay(false);
    console.log('disappear');
  });

  useNativeNavigationEvent('willAppear', () => {
    setPaused(false);
    setCanPlay(true);
    console.log('willAppear');
  });

  return { paused, canPlay };
};

export default useCoverPlayPermission;
