import { memo } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type CardModulePressableToolProps = {
  onPress?: () => void;
  children: React.ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  active: boolean;
};
const CardModulePressableTool = ({
  onPress,
  children,
  onLayout,
  active,
}: CardModulePressableToolProps) => {
  if (active) {
    const singleTap = Gesture.Tap()
      .maxDuration(250)
      .onStart(onPress ?? (() => {}));
    // I don't use PressableNative here because there is an issue when taping text on Android (using pressable from gesture handler) - to be replaced by PressableNative once android pressable are fixed
    return (
      <GestureDetector gesture={singleTap}>
        <View onLayout={onLayout}>{children}</View>
      </GestureDetector>
    );
  }
  return children;
};
export default memo(CardModulePressableTool);
