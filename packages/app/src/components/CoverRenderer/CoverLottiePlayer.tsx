import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useState } from 'react';
import Animated from 'react-native-reanimated';
import { COVER_FOREGROUND_BASE_COLOR } from '@azzapp/shared/coverHelpers';
import { replaceColor } from '@azzapp/shared/lottieHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import type { LottieViewProps } from 'lottie-react-native';
import type { AnimatedProps } from 'react-native-reanimated';

const CoverLottiePlayer = ({
  tintColor,
  src,
  onError,
  onAnimationLoaded,
  ...props
}: Omit<LottieViewProps, 'source'> & {
  tintColor: string;
  src: string | null;
  onError?: (error: string) => void;
  animatedProps?: Partial<AnimatedProps<LottieViewProps>>;
}) => {
  const [lottieJSON, setLottieJSON] = useState<any>(null);

  const onErrorLatest = useLatestCallback(onError);
  const onAnimationLoadedLatest = useLatestCallback(onAnimationLoaded);
  useEffect(() => {
    let canceled = false;

    setLottieJSON(null);
    if (src != null) {
      fetch(src)
        .then(res => res.json())
        .then(
          json => {
            if (canceled) {
              return;
            }
            setLottieJSON(json);
            setTimeout(() => {
              onAnimationLoadedLatest?.();
            }, 0);
          },
          error => {
            if (!canceled) {
              onErrorLatest?.(error);
            }
          },
        );
    }
    return () => {
      canceled = true;
    };
  }, [onErrorLatest, onAnimationLoadedLatest, src]);

  const animationData = useMemo(() => {
    if (!tintColor || !lottieJSON) {
      return lottieJSON;
    }
    return replaceColor(COVER_FOREGROUND_BASE_COLOR, tintColor, lottieJSON);
  }, [lottieJSON, tintColor]);

  return animationData ? (
    <AnimatedLottieView {...props} source={animationData} />
  ) : null;
};

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

export default CoverLottiePlayer;
