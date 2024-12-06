import { memo } from 'react';
import PressableAnimated from '#ui/PressableAnimated';
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
      <PressableAnimated onLayout={onLayout} onPress={onPress}>
        {children}
      </PressableAnimated>
    );
  }
  return children;
};
export default memo(CardModulePressableTool);
