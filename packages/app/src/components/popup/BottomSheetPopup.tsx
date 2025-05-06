import { Suspense, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
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
  children,
  isAnimatedContent = false,
  fullScreen,
}: BottomSheetPopupProps) => {
  const progress = useSharedValue(0);
  const { height } = useScreenDimensions();

  // Trigger the animation
  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: animationDuration });
    } else {
      progress.value = withTiming(0, { duration: animationDuration });
    }
  }, [animationDuration, progress, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return isAnimatedContent
      ? { transform: [{ translateY: (1 - progress.value) * height }] }
      : {};
  });

  return (
    <Suspense>
      <BottomSheetModal
        index={0}
        visible={visible}
        onDismiss={onDismiss}
        showHandleIndicator={false}
        backgroundStyle={styles.background}
        animationConfigs={animationConfigs}
        height={height}
        variant="modal"
        snapPoints={[fullScreen ? height : height / 1.25, height / 1.1]}
        keyboardBehavior="extend"
        style={styles.container}
        closeOnBackdropTouch={false}
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </BottomSheetModal>
    </Suspense>
  );
};
const styles = StyleSheet.create({
  background: { backgroundColor: 'transparent' },
  container: {
    boxShadow: 'none',
  },
});
export default BottomSheetPopup;
