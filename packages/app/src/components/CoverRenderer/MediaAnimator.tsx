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

const EMPTY_MEDIA_ANIMATION: ViewStyle = {
  opacity: 1,
  transform: [],
};

const ANIMATORS: Record<string, (param: AnimationProps) => ViewStyle> = {
  none: () => EMPTY_MEDIA_ANIMATION,
  smoothZoomOut: SmoothZoomOut,
  linearZoomOut: LinearZoomOut,
  appearZoomOut: AppearZoomOut,
  smoothZoomIn: SmoothZoomIn,
  linearZoomIn: LinearZoomIn,
  appearZoomIn: AppearZoomIn,
  fadeInOut: FadeInOut,
  pop: Pop,
  rotate: Rotate,
} as const;

export type MEDIA_ANIMATIONS = keyof typeof ANIMATORS;

export const useOrdonedAnimation = (): Array<{
  id: MEDIA_ANIMATIONS;
  label: string;
}> => {
  const intl = useIntl();
  return [
    {
      id: 'none',
      label: intl.formatMessage({
        defaultMessage: 'None',
        description: 'Cover Edition Animation - None',
      }),
    },
    {
      id: 'smoothZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom Out',
        description: 'Cover Edition Animation - Smooth Zoom Out',
      }),
    },
    {
      id: 'linearZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom Out',
        description: 'Cover Edition Animation - Linear Zoom Out',
      }),
    },
    {
      id: 'appearZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Appear Zoom Out',
        description: 'Cover Edition Animation - Appear Zoom Out',
      }),
    },
    {
      id: 'smoothZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom In',
        description: 'Cover Edition Animation - Smooth Zoom In',
      }),
    },
    {
      id: 'linearZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom In',
        description: 'Cover Edition Animation - Linear Zoom In',
      }),
    },
    {
      id: 'appearZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Animation - Appear Zoom In',
      }),
    },
    {
      id: 'fadeInOut',
      label: intl.formatMessage({
        defaultMessage: 'Fade In',
        description: 'Cover Edition Animation - Fade In',
      }),
    },
    {
      id: 'pop',
      label: intl.formatMessage({
        defaultMessage: 'Pop',
        description: 'Cover Edition Animation - Pop',
      }),
    },
    {
      id: 'rotate',
      label: intl.formatMessage({
        defaultMessage: 'Rotate',
        description: 'Cover Edition Animation - Rotate',
      }),
    },
  ] as const;
};
