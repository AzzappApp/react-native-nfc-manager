import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import getCoverAnimationProgress from './getCoverAnimationProgress';
import type { TransformsStyle, ViewProps, ViewStyle } from 'react-native';
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
  ...props
}: MediaAnimatorProps) => {
  const Animator = animation && ANIMATORS[animation];
  if (!Animator || !animationSharedValue) {
    return <View {...props} />;
  }
  return <Animator animationSharedValue={animationSharedValue} {...props} />;
};

export default MediaAnimator;

type AnimationProps = ViewProps & {
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

const createSimpleAnimation = (
  displayName: string,
  animanedStyleWorklet: (
    animationSharedValue: SharedValue<number>,
    width: number,
    height: number,
  ) => ViewStyle,
) => {
  const Animation = ({
    animationSharedValue,
    height,
    width,
    style,
    ...props
  }: AnimationProps) => {
    const animatedStyle = useAnimatedStyle(() => {
      return animanedStyleWorklet(animationSharedValue, width, height);
    });
    return <Animated.View style={[style, animatedStyle]} {...props} />;
  };
  Animation.displayName = displayName;
  return Animation;
};

const SmoothZoomOut = createSimpleAnimation(
  'SmoothZoomOut',
  (animationSharedValue, _width, height) => {
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
      transform: createZoomTransform(
        interpolate(animProgress, [0, 1, 2], [1.4, 1.1, 1]),
        true,
        height,
      ),
    };
  },
);

const LinearZoomOut = createSimpleAnimation(
  'LinearZoomOut',
  animationSharedValue => {
    'worklet';
    return {
      transform: [
        {
          scale: interpolate(animationSharedValue.value, [0, 1], [1.4, 1]),
        },
      ],
    };
  },
);

const AppearZoomOut = createSimpleAnimation(
  'AppearZoomOut',
  (animationSharedValue, _width, height) => {
    'worklet';
    const animationProgress = getCoverAnimationProgress(
      animationSharedValue.value,
      {
        duration: 0.1,
        easing: Easing.inOut(Easing.ease),
      },
    );
    return {
      transform: createZoomTransform(
        interpolate(animationProgress, [0, 1], [1.4, 1]),
        true,
        height,
      ),
    };
  },
);

const SmoothZoomIn = createSimpleAnimation(
  'SmoothZoomIn',
  (animationSharedValue, _width, height) => {
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
      transform: createZoomTransform(
        interpolate(animProgress, [0, 1, 2], [1, 1.3, 1.4]),
        true,
        height,
      ),
    };
  },
);

const LinearZoomIn = createSimpleAnimation('ZoomIn', animationSharedValue => {
  'worklet';
  return {
    transform: [
      {
        scale: interpolate(animationSharedValue.value, [0, 1], [1, 1.4]),
      },
    ],
  };
});

const AppearZoomIn = createSimpleAnimation(
  'AppearZoomIn',
  (animationSharedValue, _width, height) => {
    'worklet';
    const animationProgress = getCoverAnimationProgress(
      animationSharedValue.value,
      {
        duration: 0.1,
        easing: Easing.inOut(Easing.ease),
      },
    );
    return {
      transform: createZoomTransform(
        interpolate(animationProgress, [0, 1], [1, 1.4]),
        true,
        height,
      ),
    };
  },
);

const FadeInOut = createSimpleAnimation('FadeInOut', animationSharedValue => {
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
});

const Pop = createSimpleAnimation('Pop', animationSharedValue => {
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
    transform: [
      { scale: interpolate(animationProgress, [0, 1, 2], [1, 1.2, 1]) },
    ],
  };
});

const ANIMATORS: Record<string, React.ComponentType<AnimationProps>> = {
  smoothZoomOut: SmoothZoomOut,
  linearZoomOut: LinearZoomOut,
  appearZoomOut: AppearZoomOut,
  smoothZoomIn: SmoothZoomIn,
  linearZoomIn: LinearZoomIn,
  appearZoomIn: AppearZoomIn,
  fadeInOut: FadeInOut,
  pop: Pop,
};

export const MEDIA_ANIMATIONS = Object.keys(ANIMATORS);
