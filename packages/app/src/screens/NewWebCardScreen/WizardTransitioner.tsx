import { useCallback, useEffect, useRef, useState } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Screen, ScreenContainer } from 'react-native-screens';
import Container from '#ui/Container';
import PagerHeader from './PagerHeader';
import type { Icons } from '#ui/Icon';

type WizardTransitionerProps = {
  currentStepIndex: number;
  steps: Array<{
    title: string;
    element: React.ReactNode;
    backIcon?: Icons;
    rightElement?: React.ReactNode;
    rightElementWidth?: number;
  }>;
  headerHidden?: boolean;
  contentHeight: number;
  width: number;
  style?: StyleProp<ViewStyle>;
  onBack: () => void;
};

const WizardTransitioner = ({
  steps,
  currentStepIndex,
  contentHeight,
  headerHidden,
  width,
  style,
  onBack,
}: WizardTransitionerProps) => {
  const currentStep = steps[currentStepIndex];
  const previousStepIndex = useRef(currentStepIndex);
  const transitionProgress = useSharedValue(0);
  const [transitionInformation, setTransitionInformation] = useState<{
    transitionKind: 'back' | 'forward';
    transitioningPage: number;
    disappearingPage: number;
  } | null>(null);

  const onTransitionEnd = useCallback(() => {
    setTransitionInformation(null);
    setTimeout(() => {
      transitionProgress.value = 0;
    }, 0);
  }, [transitionProgress]);

  useEffect(() => {
    if (previousStepIndex.current === currentStepIndex) {
      return;
    }
    const transitionKind =
      currentStepIndex > previousStepIndex.current ? 'forward' : 'back';
    setTransitionInformation({
      transitionKind,
      transitioningPage:
        transitionKind === 'forward'
          ? currentStepIndex
          : previousStepIndex.current,
      disappearingPage: previousStepIndex.current,
    });
    previousStepIndex.current = currentStepIndex;
    transitionProgress.value = withTiming(
      1,
      {
        duration: TRANSITION_DURATION,
        easing: Easing.inOut(Easing.ease),
      },
      () => {
        runOnJS(onTransitionEnd)();
      },
    );
  }, [currentStepIndex, onTransitionEnd, transitionProgress]);

  return (
    <Container style={style}>
      {!headerHidden && (
        <PagerHeader
          nbPages={steps.length}
          currentPage={currentStepIndex}
          onBack={onBack}
          title={currentStep.title}
          backIcon={currentStep.backIcon}
          rightElement={currentStep.rightElement}
          rightElementWidth={currentStep.rightElementWidth}
        />
      )}

      <ScreenContainer style={{ height: contentHeight }}>
        {steps.map(({ element }, index) => (
          <TransitionScreen
            key={`NewProfileScreen-${index}`}
            activityState={
              index === currentStepIndex
                ? 2
                : transitionInformation?.disappearingPage === index
                ? 1
                : 0
            }
            transitionProgress={
              transitionInformation?.transitioningPage === index
                ? transitionProgress
                : null
            }
            transitionKind={transitionInformation?.transitionKind ?? 'forward'}
            width={width}
            height={contentHeight}
          >
            {element}
          </TransitionScreen>
        ))}
      </ScreenContainer>
    </Container>
  );
};

export default WizardTransitioner;

export const TRANSITION_DURATION = 220;

type TransitionScreenProps = {
  activityState: 0 | 1 | 2;
  transitionProgress: Animated.SharedValue<number> | null;
  transitionKind: 'back' | 'forward';
  children: React.ReactNode;
  width: number;
  height: number;
};

const TransitionScreen = ({
  activityState,
  transitionProgress,
  transitionKind,
  children,
  width,
  height,
}: TransitionScreenProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (transitionProgress == null) {
      return {};
    }
    return {
      transform: [
        {
          translateX:
            transitionKind === 'forward'
              ? (1 - transitionProgress.value) * width
              : transitionProgress.value * width,
        },
      ],
    };
  }, [transitionProgress, transitionKind]);

  const layoutStyle = { width, height };

  return (
    <Screen activityState={activityState} style={layoutStyle}>
      <Animated.View style={[layoutStyle, animatedStyle]}>
        <Container style={{ flex: 1 }}>{children}</Container>
      </Animated.View>
    </Screen>
  );
};
