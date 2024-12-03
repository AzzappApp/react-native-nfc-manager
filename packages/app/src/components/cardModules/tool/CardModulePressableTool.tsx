import { memo, useCallback } from 'react';
import PressableNative from '#ui/PressableNative';

type CardModulePressableToolProps = {
  onPress?: (index: number) => void;
  index: number;
  children: React.ReactNode;
};
const CardModulePressableTool = ({
  onPress,
  children,
  index,
}: CardModulePressableToolProps) => {
  const onPressItem = useCallback(() => {
    onPress?.(index);
  }, [index, onPress]);

  if (onPress) {
    return <PressableNative onPress={onPressItem}>{children}</PressableNative>;
  }
  return children;
};
export default memo(CardModulePressableTool);
