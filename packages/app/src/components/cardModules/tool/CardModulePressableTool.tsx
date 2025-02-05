import { memo } from 'react';
import PressableNative from '#ui/PressableNative';
import type { LayoutChangeEvent } from 'react-native';

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
    return (
      <PressableNative onLayout={onLayout} onPress={onPress}>
        {children}
      </PressableNative>
    );
  }
  return children;
};
export default memo(CardModulePressableTool);
