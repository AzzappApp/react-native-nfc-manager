import { memo, Suspense, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import useScreenDimensions from '#hooks/useScreenDimensions';
import BottomSheetModal from '#ui/BottomSheetModal';
import type { ReactNode } from 'react';

type BottomSheetPopupProps = {
  animationDuration?: number;
  visible: boolean;
  onDismiss?: () => void;
  children: ReactNode;
  onFadeOutFinish?: () => void;
  backgroundOpacity?: number;
  isAnimatedContent?: boolean;
  fullScreen?: boolean;
};

const defaultAnimationDuration = 500;
const animationConfigs = {
  // putting 0 or animateOnMount={false} makes bugs
  duration: 1,
};

const BottomSheetPopup = ({
  animationDuration = defaultAnimationDuration,
  visible,
  onDismiss,
  onFadeOutFinish,
  children,
  backgroundOpacity = 0.5,
  isAnimatedContent = false,
  fullScreen,
}: BottomSheetPopupProps) => {
  const progress = useSharedValue(0);
  const { height } = useScreenDimensions();
  const [visibleInner, setVisibleInner] = useState(visible);

  useEffect(() => {
    if (visible) setVisibleInner(visible);
  }, [visible]);

  const onFadeOutFinishInner = useCallback(() => {
    'worklet';
    runOnJS(setVisibleInner)(false);
    if (onFadeOutFinish) {
      runOnJS(onFadeOutFinish)();
    }
  }, [onFadeOutFinish]);

  // Interpolating the background color
  const animatedBackground = useAnimatedStyle(() => {
    if (backgroundOpacity === 0) {
      return {
        backgroundColor: 'transparent',
      };
    }

    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', `rgba(0, 0, 0, ${backgroundOpacity})`],
    );
    return {
      backgroundColor,
    };
  });

  // Trigger the animation
  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: animationDuration });
    } else {
      progress.value = withTiming(
        0,
        { duration: animationDuration },
        onFadeOutFinishInner,
      );
    }
  }, [animationDuration, onFadeOutFinishInner, progress, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return isAnimatedContent
      ? { transform: [{ translateY: (1 - progress.value) * height }] }
      : {};
  });

  return (
    <Suspense>
      <BottomSheetModal
        index={0}
        visible={visibleInner}
        onDismiss={onDismiss}
        showHandleIndicator={false}
        backgroundStyle={styles.background}
        animationConfigs={animationConfigs}
        showShadow={false}
        backdropComponent={() => (
          <Animated.View
            style={[StyleSheet.absoluteFill, animatedBackground]}
          />
        )}
        height={height}
        snapPoints={[fullScreen ? height : height / 1.25, height / 1.1]}
        keyboardBehavior="extend"
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </BottomSheetModal>
    </Suspense>
  );
};
const styles = StyleSheet.create({
  background: { backgroundColor: 'transparent' },
});
export default memo(BottomSheetPopup);
