import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  type TransformsStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import getCoverAnimationProgress from './getCoverAnimationProgress';
import type { SharedValue } from 'react-native-reanimated';

export type MediaAnimatorProps = ViewProps & {
  animation?: string | null;
  animationSharedValue: SharedValue<number> | null | undefined;
  height: number;
  width: number;
};

const MediaAnimator = ({
  animation = null,
  animationSharedValue,
  height,
  width,
  style,
  ...props
}: MediaAnimatorProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (!animationSharedValue) {
      return EMPTY_MEDIA_ANIMATION;
    }

    if (!animation) {
      return EMPTY_MEDIA_ANIMATION;
    } else {
      const animFunction = ANIMATORS[animation];
      return animFunction
        ? animFunction({ animationSharedValue, height, width })
        : {};
    }
  }, [animation, animationSharedValue, height, width]);

  return <Animated.View style={[style, animatedStyle]} {...props} />;
};

export default MediaAnimator;

type AnimationProps = {
  animationSharedValue: SharedValue<number>;
  height: number;
  width: number;
};

const createZoomTransform = (
  scale: number,
  anchorTop: boolean,
  height: number,
) => {
  'worklet';
  const transforms: TransformsStyle['transform'] = [];
  if (anchorTop) {
    transforms.push({
      translateY: (height * scale - height) / 2,
    });
  }
  transforms.push({ scale });
  return transforms;
};

const SmoothZoomOut = ({ animationSharedValue, height }: AnimationProps) => {
  'worklet';
  const animProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.1,
      easing: Easing.in(Easing.ease),
    },
    {
      duration: 0.9,
      easing: Easing.linear,
    },
  );
  return {
    opacity: 1,
    transform: createZoomTransform(
      interpolate(animProgress, [0, 1, 2], [1.4, 1.1, 1]),
      true,
      height,
    ),
  };
};

const LinearZoomOut = ({ animationSharedValue }: AnimationProps) => {
  'worklet';
  return {
    opacity: 1,
    transform: [
      {
        scale: interpolate(animationSharedValue.value, [0, 1], [1.4, 1]),
      },
    ],
  };
};

const AppearZoomOut = ({ animationSharedValue, height }: AnimationProps) => {
  'worklet';
  const animationProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.1,
      easing: Easing.inOut(Easing.ease),
    },
  );
  return {
    opacity: 1,
    transform: createZoomTransform(
      interpolate(animationProgress, [0, 1], [1.4, 1]),
      true,
      height,
    ),
  };
};

const SmoothZoomIn = ({ animationSharedValue, height }: AnimationProps) => {
  'worklet';
  const animProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.1,
      easing: Easing.in(Easing.ease),
    },
    {
      duration: 0.9,
      easing: Easing.linear,
    },
  );
  return {
    opacity: 1,
    transform: createZoomTransform(
      interpolate(animProgress, [0, 1, 2], [1, 1.3, 1.4]),
      true,
      height,
    ),
  };
};

const LinearZoomIn = ({ animationSharedValue }: AnimationProps) => {
  'worklet';
  return {
    opacity: 1,
    transform: [
      {
        scale: interpolate(animationSharedValue.value, [0, 1], [1, 1.4]),
      },
    ],
  };
};

const AppearZoomIn = ({ animationSharedValue, height }: AnimationProps) => {
  'worklet';
  const animationProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.1,
      easing: Easing.inOut(Easing.ease),
    },
  );
  return {
    opacity: 1,
    transform: createZoomTransform(
      interpolate(animationProgress, [0, 1], [1, 1.4]),
      true,
      height,
    ),
  };
};

const FadeInOut = ({ animationSharedValue }: AnimationProps) => {
  'worklet';
  const animationProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.5,
      easing: Easing.out(Easing.ease),
    },
    {
      duration: 0.5,
      easing: Easing.in(Easing.ease),
    },
  );
  return {
    opacity: interpolate(animationProgress, [0, 1, 2], [0, 1, 0]),
    transform: [
      { scale: interpolate(animationProgress, [0, 1, 2], [1.2, 1, 1.2]) },
    ],
  };
};

const Pop = ({ animationSharedValue }: AnimationProps) => {
  'worklet';
  const animationProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.1,
      easing: Easing.inOut(Easing.ease),
    },
    {
      duration: 0.9,
      easing: Easing.inOut(Easing.ease),
    },
  );
  return {
    opacity: 1,
    transform: [
      { scale: interpolate(animationProgress, [0, 1, 2], [1, 1.2, 1]) },
    ],
  };
};

const Rotate = ({ animationSharedValue }: AnimationProps) => {
  'worklet';

  const animationProgress = getCoverAnimationProgress(
    animationSharedValue.value,
    {
      duration: 0.1,
      easing: Easing.inOut(Easing.ease),
    },
    {
      duration: 0.9,
      easing: Easing.inOut(Easing.ease),
    },
  );
  return {
    opacity: 1,
    transform: [
      {
        rotate: `${interpolate(animationProgress, [0, 1, 2], [90, 0, 0])}deg`,
      },
      {
        scale: interpolate(
          animationProgress,
          [0, 0.7, 0.8, 1, 2],
          [2, 1.8, 1.6, 1.1, 1],
        ),
      },
    ],
  };
};

const ANIMATORS: Record<string, (param: AnimationProps) => ViewStyle> = {
  smoothZoomOut: SmoothZoomOut,
  linearZoomOut: LinearZoomOut,
  appearZoomOut: AppearZoomOut,
  smoothZoomIn: SmoothZoomIn,
  linearZoomIn: LinearZoomIn,
  appearZoomIn: AppearZoomIn,
  fadeInOut: FadeInOut,
  pop: Pop,
  rotate: Rotate,
};

export const MEDIA_ANIMATIONS = Object.keys(ANIMATORS);

export function useAnimationLabel(animation: string) {
  const intl = useIntl();
  //i need to define all those code.....(and cannot use param in the render item)..; kind of ulgy
  const label = useMemo(() => {
    switch (animation) {
      case 'smoothZoomOut':
        return intl.formatMessage({
          defaultMessage: 'Smooth Zoom Out',
          description: 'Cover Edition Animation - Smooth Zoom Out',
        });
      case 'linearZoomOut':
        return intl.formatMessage({
          defaultMessage: 'Linear Zoom Out',
          description: 'Cover Edition Animation - Linear Zoom Out',
        });
      case 'appearZoomOut':
        return intl.formatMessage({
          defaultMessage: 'Appear Zoom Out',
          description: 'Cover Edition Animation - Appear Zoom Out',
        });
      case 'smoothZoomIn':
        return intl.formatMessage({
          defaultMessage: 'Smooth Zoom In',
          description: 'Cover Edition Animation - Smooth Zoom In',
        });
      case 'linearZoomIn':
        return intl.formatMessage({
          defaultMessage: 'Linear Zoom In',
          description: 'Cover Edition Animation - Linear Zoom In',
        });
      case 'appearZoomIn':
        return intl.formatMessage({
          defaultMessage: 'Zoom In',
          description: 'Cover Edition Animation - Appear Zoom In',
        });
      case 'fadeInOut':
        return intl.formatMessage({
          defaultMessage: 'Fade In',
          description: 'Cover Edition Animation - Fade In',
        });
      case 'pop':
        return intl.formatMessage({
          defaultMessage: 'Pop',
          description: 'Cover Edition Animation - Pop',
        });
      case 'rotate':
        return intl.formatMessage({
          defaultMessage: 'Rotate',
          description: 'Cover Edition Animation - Rotate',
        });
      case 'none':
        return intl.formatMessage({
          defaultMessage: 'None',
          description: 'Cover Edition Animation - None',
        });
      default:
        console.warn('Animation not translated: ' + animation);
        return animation;
    }
  }, [animation, intl]);
  return label;
}

const EMPTY_MEDIA_ANIMATION: ViewStyle = {
  opacity: 1,
  transform: [],
};
