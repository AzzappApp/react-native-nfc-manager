import { interpolate } from 'react-native-reanimated';
import type { EasingFunction } from 'react-native-reanimated';

function getCoverAnimationProgress(
  animationProgress: number,
  enterAnimationSpec: {
    duration: number;
    delay?: number;
    easing: EasingFunction;
  },
  exitAnimationSpec?: { duration: number; easing: EasingFunction },
) {
  'worklet';
  let resultAnimationProgress = exitAnimationSpec
    ? interpolate(
        animationProgress,
        [
          0,
          enterAnimationSpec.delay ?? 0,
          (enterAnimationSpec.delay ?? 0) + enterAnimationSpec.duration,
          1 - exitAnimationSpec.duration,
          1,
        ],
        [0, 0, 1, 1, 2],
      )
    : interpolate(
        animationProgress,
        [
          0,
          enterAnimationSpec.delay ?? 0,
          (enterAnimationSpec.delay ?? 0) + enterAnimationSpec.duration,
          1,
        ],
        [0, 0, 1, 1],
      );

  if (resultAnimationProgress < 1) {
    resultAnimationProgress = enterAnimationSpec.easing(
      resultAnimationProgress,
    );
  } else if (resultAnimationProgress > 1 && exitAnimationSpec) {
    resultAnimationProgress =
      exitAnimationSpec.easing(resultAnimationProgress - 1) + 1;
  }
  return resultAnimationProgress;
}

export default getCoverAnimationProgress;
