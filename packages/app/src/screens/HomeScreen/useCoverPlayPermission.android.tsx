import { useScreenHasFocus } from '#components/NativeRouter';

const useCoverPlayPermission = () => {
  const focus = useScreenHasFocus();

  return { paused: !focus, canPlay: focus };
};

export default useCoverPlayPermission;
