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
  let textAnimationProgress = exitAnimationSpec
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

  if (textAnimationProgress < 1) {
    textAnimationProgress = enterAnimationSpec.easing(textAnimationProgress);
  } else if (textAnimationProgress > 1 && exitAnimationSpec) {
    textAnimationProgress =
      exitAnimationSpec.easing(textAnimationProgress - 1) + 1;
  }
  return textAnimationProgress;
}

export default getCoverAnimationProgress;
